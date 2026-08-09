package mx.edu.uteq.virtual_queue_back.notification;

import java.io.FileInputStream;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

	private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

	@Value("${firebase.credentials-path:}")
	private String credentialsPath;

	@PostConstruct
	public void init() {
		if (credentialsPath == null || credentialsPath.isBlank()) {
			log.info("Firebase credentials not configured; push notifications disabled");
			return;
		}
		if (!FirebaseApp.getApps().isEmpty()) {
			return;
		}
		try (FileInputStream stream = new FileInputStream(credentialsPath)) {
			FirebaseOptions options = FirebaseOptions.builder()
					.setCredentials(GoogleCredentials.fromStream(stream))
					.build();
			FirebaseApp.initializeApp(options);
			log.info("Firebase initialized");
		}
		catch (IOException ex) {
			log.warn("Failed to initialize Firebase: {}", ex.getMessage());
		}
	}
}
