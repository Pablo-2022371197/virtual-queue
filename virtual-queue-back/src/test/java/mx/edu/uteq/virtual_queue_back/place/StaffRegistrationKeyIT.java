package mx.edu.uteq.virtual_queue_back.place;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import mx.edu.uteq.virtual_queue_back.common.UserRole;
import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.place.repository.PlaceRepository;
import mx.edu.uteq.virtual_queue_back.place.service.StaffRegistrationKeyService;
import mx.edu.uteq.virtual_queue_back.user.entity.User;
import mx.edu.uteq.virtual_queue_back.user.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StaffRegistrationKeyIT {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PlaceRepository placeRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private StaffRegistrationKeyService staffRegistrationKeyService;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void adminCanRotateKeyAndOldKeyStopsWorking() throws Exception {
		Place place = Place.builder()
				.id(UUID.randomUUID())
				.name("Key Place")
				.active(true)
				.build();
		String oldKey = staffRegistrationKeyService.generatePlainKey();
		place.setStaffRegistrationKeyDigest(staffRegistrationKeyService.digest(oldKey));
		placeRepository.save(place);

		User admin = User.builder()
				.id(UUID.randomUUID())
				.fullName("Admin Keys")
				.email("admin-keys@example.com")
				.username("adminkeys")
				.passwordHash(passwordEncoder.encode("password123"))
				.role(UserRole.ADMIN)
				.enabled(true)
				.build();
		userRepository.save(admin);

		MvcResult login = mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"adminkeys","password":"password123"}
								"""))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode loginJson = objectMapper.readTree(login.getResponse().getContentAsString());
		String token = loginJson.path("accessToken").asText();

		MvcResult rotate = mockMvc.perform(post("/api/places/" + place.getId() + "/staff-registration-key/rotate")
						.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.staffRegistrationKey").isNotEmpty())
				.andExpect(jsonPath("$.placeId").value(place.getId().toString()))
				.andReturn();

		String newKey = objectMapper.readTree(rotate.getResponse().getContentAsString())
				.path("staffRegistrationKey")
				.asText();

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "Old Key Staff",
								  "email": "old-key-staff@example.com",
								  "username": "oldkeystaff",
								  "password": "password123",
								  "role": "STAFF",
								  "staffRegistrationKey": "%s"
								}
								""".formatted(oldKey)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("INVALID_STAFF_REGISTRATION_KEY"));

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fullName": "New Key Staff",
								  "email": "new-key-staff@example.com",
								  "username": "newkeystaff",
								  "password": "password123",
								  "role": "STAFF",
								  "staffRegistrationKey": "%s"
								}
								""".formatted(newKey)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.user.role").value("STAFF"))
				.andExpect(jsonPath("$.user.placeName").value("Key Place"));
	}
}
