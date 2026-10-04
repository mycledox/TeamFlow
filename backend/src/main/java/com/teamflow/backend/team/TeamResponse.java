package com.teamflow.backend.team;

import java.time.Instant;
import java.util.List;

import com.teamflow.backend.user.UserResponse;

public record TeamResponse(
        Long id,
        String name,
        String description,
        List<UserResponse> members,
        Instant createdAt,
        Instant updatedAt) {
    public static TeamResponse from(Team team) {
        return new TeamResponse(team.getId(), team.getName(), team.getDescription(),
                team.getMembers().stream().map(UserResponse::from).toList(),
                team.getCreatedAt(), team.getUpdatedAt());
    }
}
