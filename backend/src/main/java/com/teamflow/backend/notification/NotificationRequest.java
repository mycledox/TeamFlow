package com.teamflow.backend.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NotificationRequest(
        @NotBlank @Size(max = 500) String message,
        @NotBlank @Size(max = 30) String kind,
        @NotNull Long userId) {
}
