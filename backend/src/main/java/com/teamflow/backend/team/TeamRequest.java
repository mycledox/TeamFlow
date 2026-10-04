package com.teamflow.backend.team;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TeamRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description,
        Set<Long> memberIds) {
}
