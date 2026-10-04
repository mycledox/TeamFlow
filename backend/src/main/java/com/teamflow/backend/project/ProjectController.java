package com.teamflow.backend.project;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.teamflow.backend.common.ApiException;
import com.teamflow.backend.team.Team;
import com.teamflow.backend.team.TeamRepository;
import com.teamflow.backend.task.TaskRepository;
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
@RequestMapping("/api/projects")
@Transactional
public class ProjectController {
    private static final Set<String> STATUSES = Set.of("active", "completed");
    private static final Set<String> COLORS = Set.of("blue", "purple", "orange", "green");

    private final ProjectRepository projects;
    private final TeamRepository teams;
    private final UserRepository users;
    private final TaskRepository tasks;

    public ProjectController(ProjectRepository projects, TeamRepository teams, UserRepository users, TaskRepository tasks) {
        this.projects = projects;
        this.teams = teams;
        this.users = users;
        this.tasks = tasks;
    }

    @GetMapping
    public List<ProjectResponse> list(@RequestParam(required = false) Long teamId) {
        List<Project> result = teamId == null ? projects.findAll() : projects.findAllByTeamId(teamId);
        return result.stream().map(ProjectResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable Long id) {
        return ProjectResponse.from(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request) {
        Project project = new Project();
        apply(project, request);
        return ProjectResponse.from(projects.save(project));
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        Project project = find(id);
        apply(project, request);
        return ProjectResponse.from(projects.save(project));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Project project = find(id);
        tasks.deleteAllByProjectId(project.getId());
        projects.delete(project);
    }

    private Project find(Long id) {
        return projects.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private void apply(Project project, ProjectRequest request) {
        String status = request.status().trim().toLowerCase();
        String color = request.color() == null || request.color().isBlank() ? "blue" : request.color().trim().toLowerCase();
        if (!STATUSES.contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Project status must be active or completed");
        }
        if (!COLORS.contains(color)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Project color must be blue, purple, orange, or green");
        }
        Team team = teams.findById(request.teamId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Team not found"));
        Set<Long> ids = request.memberIds() == null ? Set.of() : request.memberIds();
        Set<User> members = users.findAllById(ids).stream().collect(Collectors.toSet());
        if (members.size() != ids.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "One or more project member IDs do not exist");
        }
        project.setName(request.name().trim());
        project.setCategory(request.category());
        project.setDescription(request.description());
        project.setDueDate(request.dueDate());
        project.setColor(color);
        project.setStatus(status);
        project.setTeam(team);
        project.setMembers(members);
    }
}
