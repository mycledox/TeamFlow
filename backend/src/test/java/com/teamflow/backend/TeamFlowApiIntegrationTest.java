package com.teamflow.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TeamFlowApiIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsAndListsUser() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Jordan Reed","email":"jordan@example.com","role":"Member"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("jordan@example.com"));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void createsRelatedWorkspaceRecordsAndSupportsUpdatesAndDeletes() throws Exception {
        long userId = create("/api/users",
                """
                {"name":"Jordan Reed","email":"jordan@example.com","role":"Member"}
                """);
        long teamId = create("/api/teams",
                """
                {"name":"Product Team","description":"Product delivery","memberIds":[%d]}
                """.formatted(userId));
        long projectId = create("/api/projects",
                """
                {"name":"Launch","category":"Product","description":"Ship launch","status":"active","teamId":%d,"memberIds":[%d]}
                """.formatted(teamId, userId));
        long taskId = create("/api/tasks",
                """
                {"title":"Prepare release","status":"todo","priority":"high","projectId":%d,"assigneeId":%d}
                """.formatted(projectId, userId));

        mockMvc.perform(get("/api/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamId").value(teamId))
                .andExpect(jsonPath("$.members[0].id").value(userId));

        mockMvc.perform(put("/api/tasks/{id}", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Prepare release","status":"done","priority":"high","projectId":%d,"assigneeId":%d}
                                """.formatted(projectId, userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"));

        long notificationId = create("/api/notifications",
                """
                {"message":"Release task complete","kind":"complete","userId":%d}
                """.formatted(userId));
        mockMvc.perform(patch("/api/notifications/{id}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));

        mockMvc.perform(delete("/api/projects/{id}", projectId))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/tasks/{id}", taskId))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsInvalidTaskStateAndReportsMissingResources() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Invalid task","status":"blocked","priority":"urgent","projectId":1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Invalid status.")))
                .andExpect(jsonPath("$.details").isMap());

        mockMvc.perform(get("/api/users/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    private long create(String path, String body) throws Exception {
        MvcResult result = mockMvc.perform(post(path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        String json = result.getResponse().getContentAsString();
        return Long.parseLong(json.replaceAll("(?s)^\\s*\\{\\s*\\\"id\\\"\\s*:\\s*(\\d+).*", "$1"));
    }
}
