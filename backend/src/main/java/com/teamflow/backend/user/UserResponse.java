package com.teamflow.backend.user;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean emailNotifications,
        boolean taskReminders,
        Instant createdAt,
        Instant updatedAt) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
                user.isEmailNotifications(), user.isTaskReminders(), user.getCreatedAt(), user.getUpdatedAt());
    }
}
