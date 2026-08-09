package mx.edu.uteq.virtual_queue_back.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import mx.edu.uteq.virtual_queue_back.user.entity.User;

@Service
public class JwtService {

	private final JwtProperties properties;
	private final SecretKey key;

	public JwtService(JwtProperties properties) {
		this.properties = properties;
		this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
	}

	public String generateAccessToken(User user) {
		Instant now = Instant.now();
		return Jwts.builder()
				.subject(user.getUsername())
				.claim("uid", user.getId().toString())
				.claim("role", user.getRole().name())
				.issuedAt(Date.from(now))
				.expiration(Date.from(now.plusSeconds(properties.accessTtl())))
				.signWith(key)
				.compact();
	}

	public Claims parseToken(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public boolean isValid(String token) {
		try {
			Claims claims = parseToken(token);
			return claims.getExpiration().after(new Date());
		}
		catch (Exception ex) {
			return false;
		}
	}

	public UUID extractUserId(String token) {
		return UUID.fromString(parseToken(token).get("uid", String.class));
	}

	public String extractUsername(String token) {
		return parseToken(token).getSubject();
	}

	public long accessTtlSeconds() {
		return properties.accessTtl();
	}
}
