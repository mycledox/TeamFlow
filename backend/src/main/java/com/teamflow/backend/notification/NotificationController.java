package com.teamflow.backend.notification;

import java.time.Instant;
import java.util.List;

import com.teamflow.backend.common.ApiException;
import com.teamflow.backend.user.User;
import com.teamflow.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@Transactional
public class NotificationController {
    private final NotificationRepository notifications;
    private final UserRepository users;

    public NotificationController(NotificationRepository notifications, UserRepository users) {
        this.notifications = notifications;
        this.users = users;
    }

    @GetMapping
    public List<NotificationResponse> list(@RequestParam Long userId, @RequestParam(defaultValue = "false") boolean unreadOnly) {
        List<Notification> result = unreadOnly
                ? notifications.findAllByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId)
                : notifications.findAllByUserIdOrderByCreatedAtDesc(userId);
        return result.stream().map(NotificationResponse::from).toList();
    }

    @GetMapping("/{id}")
    public NotificationResponse get(@PathVariable Long id) {
        return NotificationResponse.from(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationResponse create(@Valid @RequestBody NotificationRequest request) {
        User user = users.findById(request.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "User not found"));
        Notification notification = new Notification();
        notification.setMessage(request.message().trim());
        notification.setKind(request.kind().trim().toLowerCase());
        notification.setUser(user);
        return NotificationResponse.from(notifications.save(notification));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id) {
        Notification notification = find(id);
        if (notification.getReadAt() == null) notification.setReadAt(Instant.now());
        return NotificationResponse.from(notifications.save(notification));
    }

    @PatchMapping("/read-all")
    public List<NotificationResponse> markAllRead(@RequestParam Long userId) {
        if (!users.existsById(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }
        List<Notification> result = notifications.findAllByUserIdOrderByCreatedAtDesc(userId);
        Instant now = Instant.now();
        result.stream().filter(notification -> notification.getReadAt() == null)
                .forEach(notification -> notification.setReadAt(now));
        return notifications.saveAll(result).stream().map(NotificationResponse::from).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        notifications.delete(find(id));
    }

    private Notification find(Long id) {
        return notifications.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
    }
}
