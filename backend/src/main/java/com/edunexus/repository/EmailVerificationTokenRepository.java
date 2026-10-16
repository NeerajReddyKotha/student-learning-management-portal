package com.edunexus.repository;

import com.edunexus.domain.EmailVerificationToken;
import com.edunexus.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
    Optional<EmailVerificationToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
    void deleteByUser(User user);
}
