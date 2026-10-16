package com.edunexus.auth;

import com.edunexus.domain.Role;
import com.edunexus.domain.User;
import com.edunexus.dto.ForgotPasswordRequest;
import com.edunexus.dto.LoginRequest;
import com.edunexus.dto.RegisterRequest;
import com.edunexus.dto.ResetPasswordRequest;
import com.edunexus.repository.RoleRepository;
import com.edunexus.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setupRolesAndUsers() {
        if (roleRepository.findByName("ROLE_STUDENT").isEmpty()) {
            roleRepository.save(new Role("ROLE_STUDENT", "Student"));
        }
        if (roleRepository.findByName("ROLE_TRAINER").isEmpty()) {
            roleRepository.save(new Role("ROLE_TRAINER", "Trainer"));
        }
        if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
            roleRepository.save(new Role("ROLE_ADMIN", "Admin"));
        }

        if (userRepository.findByEmailIgnoreCase("existing@edunexus.edu").isEmpty()) {
            Role studentRole = roleRepository.findByName("ROLE_STUDENT").get();
            User user = User.builder()
                .email("existing@edunexus.edu")
                .passwordHash(passwordEncoder.encode("EduNexus2026!Secure"))
                .firstName("Existing")
                .lastName("Student")
                .active(true)
                .emailVerified(true)
                .roles(new HashSet<>(List.of(studentRole)))
                .build();
            userRepository.save(user);
        }
    }

    @Test
    @DisplayName("1. User registration succeeds and assigns ROLE_STUDENT")
    void testRegistrationSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
            "newstudent@edunexus.edu",
            "EduNexus2026!Valid",
            "Alice",
            "Smith"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.user.email").value("newstudent@edunexus.edu"))
            .andExpect(jsonPath("$.user.roles", hasItem("ROLE_STUDENT")))
            .andExpect(cookie().exists("edunexus_jwt"))
            .andExpect(cookie().httpOnly("edunexus_jwt", true));
    }

    @Test
    @DisplayName("2. User registration rejects duplicate email")
    void testRegistrationDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
            "existing@edunexus.edu",
            "EduNexus2026!Valid",
            "Duplicate",
            "User"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("3. Login succeeds with valid credentials and sets HTTP-only cookie")
    void testLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("existing@edunexus.edu", "EduNexus2026!Secure");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.user.email").value("existing@edunexus.edu"))
            .andExpect(cookie().exists("edunexus_jwt"))
            .andExpect(cookie().httpOnly("edunexus_jwt", true));
    }

    @Test
    @DisplayName("4. Login fails with invalid password")
    void testLoginInvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest("existing@edunexus.edu", "WrongPassword!999");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. Logout clears the HTTP-only cookie")
    void testLogoutClearsCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isOk())
            .andExpect(cookie().maxAge("edunexus_jwt", 0));
    }

    @Test
    @DisplayName("6. Forgot password prevents user enumeration (always returns 200 OK)")
    void testForgotPasswordAntiEnumeration() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent@edunexus.edu");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message", containsString("If an account exists with this email")));
    }

    @Test
    @WithMockUser(authorities = "ROLE_STUDENT")
    @DisplayName("7. Student can access student dashboard but is denied access to trainer and admin dashboards")
    void testStudentRoleBoundaries() throws Exception {
        mockMvc.perform(get("/api/v1/student/dashboard"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/trainer/dashboard"))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_TRAINER")
    @DisplayName("8. Trainer can access trainer dashboard but is denied admin dashboard")
    void testTrainerRoleBoundaries() throws Exception {
        mockMvc.perform(get("/api/v1/trainer/dashboard"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    @DisplayName("9. Admin can access admin, trainer, and student dashboards")
    void testAdminRoleAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/trainer/dashboard"))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/student/dashboard"))
            .andExpect(status().isOk());
    }
}
