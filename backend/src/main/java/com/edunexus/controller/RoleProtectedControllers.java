package com.edunexus.controller;

import com.edunexus.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class RoleProtectedControllers {

    @GetMapping("/student/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_TRAINER', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getStudentDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of(
            "role", "STUDENT",
            "message", "Welcome to EduNexus Student Portal",
            "user", principal.getUsername(),
            "enrolledCoursesCount", 3,
            "completedLessonsCount", 14,
            "nextMilestone", "Phase 2 Course Catalog & Learning Modules"
        ));
    }

    @GetMapping("/trainer/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_TRAINER', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTrainerDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of(
            "role", "TRAINER",
            "message", "Welcome to EduNexus Trainer Faculty Studio",
            "user", principal.getUsername(),
            "createdCoursesCount", 5,
            "activeStudentsCount", 142,
            "studioStatus", "Ready for Curriculum Authoring"
        ));
    }

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of(
            "role", "ADMIN",
            "message", "Welcome to EduNexus Platform Governance & Security Administration",
            "user", principal.getUsername(),
            "totalUsersCount", 1250,
            "activeTrainersCount", 48,
            "securityStatus", "Optimal (All Security Probes Passing)"
        ));
    }
}
