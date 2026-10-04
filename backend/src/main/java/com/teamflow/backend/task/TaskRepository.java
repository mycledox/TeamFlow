package com.teamflow.backend.task;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findAllByProjectId(Long projectId);
    List<Task> findAllByAssigneeId(Long assigneeId);
    void deleteAllByProjectId(Long projectId);
}
