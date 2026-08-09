package mx.edu.uteq.virtual_queue_back.place.service;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Locale;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

import mx.edu.uteq.virtual_queue_back.place.StaffRegistrationKeyProperties;

@Service
public class StaffRegistrationKeyService {

	/** Alphabet without ambiguous characters (0/O, 1/I/L). */
	private static final char[] ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
	private static final int KEY_LENGTH = 8;

	private final StaffRegistrationKeyProperties properties;
	private final SecureRandom secureRandom = new SecureRandom();

	public StaffRegistrationKeyService(StaffRegistrationKeyProperties properties) {
		this.properties = properties;
	}

	public String generatePlainKey() {
		char[] chars = new char[KEY_LENGTH];
		for (int i = 0; i < KEY_LENGTH; i++) {
			chars[i] = ALPHABET[secureRandom.nextInt(ALPHABET.length)];
		}
		return new String(chars);
	}

	public String normalize(String rawKey) {
		if (rawKey == null) {
			return null;
		}
		return rawKey.trim().toUpperCase(Locale.ROOT);
	}

	public boolean isValidFormat(String normalizedKey) {
		return normalizedKey != null
				&& normalizedKey.length() == KEY_LENGTH
				&& normalizedKey.chars().allMatch(c -> {
					for (char allowed : ALPHABET) {
						if (allowed == c) {
							return true;
						}
					}
					return false;
				});
	}

	public String digest(String normalizedKey) {
		String pepper = properties.pepper();
		if (pepper == null || pepper.isBlank()) {
			throw new IllegalStateException("STAFF_REGISTRATION_KEY_PEPPER is not configured");
		}
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			byte[] hash = mac.doFinal(normalizedKey.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		}
		catch (NoSuchAlgorithmException | InvalidKeyException ex) {
			throw new IllegalStateException("Unable to compute staff registration key digest", ex);
		}
	}
}
