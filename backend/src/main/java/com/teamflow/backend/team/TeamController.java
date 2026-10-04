package com.teamflow.backend.team;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.teamflow.backend.common.ApiException;
import com.teamflow.backend.project.Project;
import com.teamflow.backend.project.ProjectRepository;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
@Transactional
public class TeamController {
    private final TeamRepository teams;
    private final UserRepository users;
    private final ProjectRepository projects;
    private final TaskRepository tasks;

    public TeamController(TeamRepository teams, UserRepository users, ProjectRepository projects, TaskRepository tasks) {
        this.teams = teams;
        this.users = users;
        this.projects = projects;
        this.tasks = tasks;
    }

    @GetMapping
    public List<TeamResponse> list() {
        return teams.findAll().stream().map(TeamResponse::from).toList();
    }

    @GetMapping("/{id}")
    public TeamResponse get(@PathVariable Long id) {
        return TeamResponse.from(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamResponse create(@Valid @RequestBody TeamRequest request) {
        Team team = new Team();
        apply(team, request);
        return TeamResponse.from(teams.save(team));
    }

    @PutMapping("/{id}")
    public TeamResponse update(@PathVariable Long id, @Valid @RequestBody TeamRequest request) {
        Team team = find(id);
        apply(team, request);
        return TeamResponse.from(teams.save(team));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        Team team = find(id);
        for (Project project : projects.findAllByTeamId(team.getId())) {
            tasks.deleteAllByProjectId(project.getId());
            projects.delete(project);
        }
        teams.delete(team);
    }

    private Team find(Long id) {
        return teams.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Team not found"));
    }

    private void apply(Team team, TeamRequest request) {
        team.setName(request.name().trim());
        team.setDescription(request.description());
        Set<Long> ids = request.memberIds() == null ? Set.of() : request.memberIds();
        Set<User> members = users.findAllById(ids).stream().collect(Collectors.toSet());
        if (members.size() != ids.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "One or more team member IDs do not exist");
        }
        team.setMembers(members);
    }
}
