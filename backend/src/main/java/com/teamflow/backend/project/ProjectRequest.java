package com.teamflow.backend.project;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 80) String category,
        @Size(max = 1000) String description,
        LocalDate dueDate,
        @Size(max = 20) String color,
        @NotBlank @Size(max = 20) String status,
        @NotNull Long teamId,
        Set<Long> memberIds) {
}
