package mx.edu.uteq.virtual_queue_back.place;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.staff-registration")
public record StaffRegistrationKeyProperties(String pepper) {
}
