package com.teamflow.backend.task;

import java.util.List;
import java.util.Set;

import com.teamflow.backend.common.ApiException;
import com.teamflow.backend.project.Project;
import com.teamflow.backend.project.ProjectRepository;
import com.teamflow.backend.user.User;
import com.teamflow.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@Transactional
public class TaskController {
    private static final Set<String> STATUSES = Set.of("todo", "in-progress", "done");
    private static final Set<String> PRIORITIES = Set.of("low", "medium", "high");

    private final TaskRepository tasks;
    private final ProjectRepository projects;
    private final UserRepository users;

    public TaskController(TaskRepository tasks, ProjectRepository projects, UserRepository users) {
        this.tasks = tasks;
        this.projects = projects;
        this.users = users;
    }

    @GetMapping
    public List<TaskResponse> list(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) String status) {
        List<Task> result;
        if (projectId != null) result = tasks.findAllByProjectId(projectId);
        else if (assigneeId != null) result = tasks.findAllByAssigneeId(assigneeId);
        else result = tasks.findAll();
        if (status != null && !status.isBlank()) {
            String requestedStatus = status.trim().toLowerCase();
            validateChoice("status", requestedStatus, STATUSES);
            result = result.stream().filter(task -> task.getStatus().equals(requestedStatus)).toList();
        }
        return result.stream().map(TaskResponse::from).toList();
    }

    @GetMapping("/{id}")
    public TaskResponse get(@PathVariable Long id) {
        return TaskResponse.from(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@Valid @RequestBody TaskRequest request) {
        Task task = new Task();
        apply(task, request);
        return TaskResponse.from(tasks.save(task));
    }

    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        Task task = find(id);
        apply(task, request);
        return TaskResponse.from(tasks.save(task));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tasks.delete(find(id));
    }

    private Task find(Long id) {
        return tasks.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private void apply(Task task, TaskRequest request) {
        String status = request.status().trim().toLowerCase();
        String priority = request.priority().trim().toLowerCase();
        validateChoice("status", status, STATUSES);
        validateChoice("priority", priority, PRIORITIES);
        Project project = projects.findById(request.projectId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Project not found"));
        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = users.findById(request.assigneeId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Assignee not found"));
        }
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setStatus(status);
        task.setPriority(priority);
        task.setDueDate(request.dueDate());
        task.setProject(project);
        task.setAssignee(assignee);
    }

    private void validateChoice(String field, String value, Set<String> allowed) {
        if (!allowed.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid " + field + ". Allowed values: " + String.join(", ", allowed));
        }
    }
}
