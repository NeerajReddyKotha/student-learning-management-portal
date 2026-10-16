package com.edunexus.repository;

import com.edunexus.domain.UserLoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface UserLoginAttemptRepository extends JpaRepository<UserLoginAttempt, UUID> {

    @Query("SELECT COUNT(a) FROM UserLoginAttempt a WHERE a.ipAddress = :ip AND a.successful = false AND a.attemptedAt >= :since")
    long countFailedAttemptsByIpSince(@Param("ip") String ipAddress, @Param("since") Instant since);

    @Query("SELECT COUNT(a) FROM UserLoginAttempt a WHERE a.email = :email AND a.successful = false AND a.attemptedAt >= :since")
    long countFailedAttemptsByEmailSince(@Param("email") String email, @Param("since") Instant since);
}
