package com.teamflow.backend.task;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 1000) String description,
        @NotBlank @Size(max = 20) String status,
        @NotBlank @Size(max = 20) String priority,
        LocalDate dueDate,
        @NotNull Long projectId,
        Long assigneeId) {
}
