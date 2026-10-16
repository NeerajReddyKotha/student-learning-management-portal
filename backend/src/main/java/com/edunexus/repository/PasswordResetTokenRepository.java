package com.edunexus.repository;

import com.edunexus.domain.PasswordResetToken;
import com.edunexus.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
    void deleteByUser(User user);
}
