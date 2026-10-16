package com.edunexus.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private static final int MAX_ATTEMPTS_PER_WINDOW = 10;
    private static final long WINDOW_SECONDS = 60;

    private static class RequestBucket {
        int count;
        Instant windowStart;

        RequestBucket() {
            this.count = 1;
            this.windowStart = Instant.now();
        }
    }

    private final Map<String, RequestBucket> ipBuckets = new ConcurrentHashMap<>();
    private final Map<String, RequestBucket> emailBuckets = new ConcurrentHashMap<>();

    public synchronized boolean isRateLimited(String ipAddress, String email) {
        Instant now = Instant.now();

        // 1. Check IP Bucket
        if (ipAddress != null && !ipAddress.isBlank()) {
            RequestBucket ipBucket = ipBuckets.compute(ipAddress, (k, bucket) -> {
                if (bucket == null || now.isAfter(bucket.windowStart.plusSeconds(WINDOW_SECONDS))) {
                    return new RequestBucket();
                }
                bucket.count++;
                return bucket;
            });
            if (ipBucket.count > MAX_ATTEMPTS_PER_WINDOW) {
                return true;
            }
        }

        // 2. Check Email Bucket (if provided)
        if (email != null && !email.isBlank()) {
            RequestBucket emailBucket = emailBuckets.compute(email.toLowerCase(), (k, bucket) -> {
                if (bucket == null || now.isAfter(bucket.windowStart.plusSeconds(WINDOW_SECONDS))) {
                    return new RequestBucket();
                }
                bucket.count++;
                return bucket;
            });
            if (emailBucket.count > MAX_ATTEMPTS_PER_WINDOW) {
                return true;
            }
        }

        return false;
    }

    public synchronized void recordSuccessfulLogin(String email) {
        if (email != null) {
            emailBuckets.remove(email.toLowerCase());
        }
    }
}
