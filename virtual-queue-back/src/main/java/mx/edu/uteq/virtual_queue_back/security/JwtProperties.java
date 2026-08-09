package mx.edu.uteq.virtual_queue_back.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(String secret, long accessTtl, long refreshTtl) {
}
