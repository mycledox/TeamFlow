package com.teamflow.backend.project;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.teamflow.backend.user.UserResponse;

public record ProjectResponse(
        Long id,
        String name,
        String category,
        String description,
        LocalDate dueDate,
        String color,
        String status,
        Long teamId,
        String teamName,
        List<UserResponse> members,
        Instant createdAt,
        Instant updatedAt) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(project.getId(), project.getName(), project.getCategory(),
                project.getDescription(), project.getDueDate(), project.getColor(), project.getStatus(),
                project.getTeam().getId(), project.getTeam().getName(),
                project.getMembers().stream().map(UserResponse::from).toList(),
                project.getCreatedAt(), project.getUpdatedAt());
    }
}
