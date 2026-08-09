package mx.edu.uteq.virtual_queue_back.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import mx.edu.uteq.virtual_queue_back.place.entity.Place;
import mx.edu.uteq.virtual_queue_back.place.repository.PlaceRepository;
import mx.edu.uteq.virtual_queue_back.place.service.StaffRegistrationKeyService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PlaceRepository placeRepository;

	@Autowired
	private StaffRegistrationKeyService staffRegistrationKeyService;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void registerAndLogin() throws Exception {
		String registerBody = """
				{
				  "fullName": "Test User",
				  "email": "test@example.com",
				  "username": "testuser",
				  "password": "password123"
				}
				""";

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(registerBody))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.user.username").value("testuser"))
				.andExpect(jsonPath("$.user.role").value("CUSTOMER"));

		String loginBody = """
				{
				  "username": "testuser",
				  "password": "password123"
				}
				""";

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginBody))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tokenType").value("Bearer"));

		String emailLoginBody = """
				{
				  "username": "test@example.com",
				  "password": "password123"
				}
				""";

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(emailLoginBody))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.user.username").value("testuser"));
	}

	@Test
	void registerStaffWithValidKey() throws Exception {
		String plainKey = seedPlaceWithKey("Staff Place A");

		String registerBody = """
				{
				  "fullName": "Staff User",
				  "email": "staff-reg@example.com",
				  "username": "staffreg",
				  "password": "password123",
				  "role": "STAFF",
				  "staffRegistrationKey": "%s"
				}
				""".formatted(plainKey);

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(registerBody))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.user.role").value("STAFF"))
				.andExpect(jsonPath("$.user.placeName").value("Staff Place A"));
	}

	@Test
	void registerStaffWithInvalidKeyFails() throws Exception {
		String registerBody = """
				{
				  "fullName": "Staff User",
				  "email": "staff-bad@example.com",
				  "username": "staffbad",
				  "password": "password123",
				  "role": "STAFF",
				  "staffRegistrationKey": "AABBCCDD"
				}
				""";

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(registerBody))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("INVALID_STAFF_REGISTRATION_KEY"));
	}

	@Test
	void registerAdminRoleIsRejected() throws Exception {
		String registerBody = """
				{
				  "fullName": "Admin Wannabe",
				  "email": "admin-wannabe@example.com",
				  "username": "adminwannabe",
				  "password": "password123",
				  "role": "ADMIN"
				}
				""";

		mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(registerBody))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rotateEndpointRequiresAdmin() throws Exception {
		Place place = Place.builder()
				.id(UUID.randomUUID())
				.name("Protected Place")
				.active(true)
				.build();
		placeRepository.save(place);

		String customerBody = """
				{
				  "fullName": "Customer User",
				  "email": "customer-rotate@example.com",
				  "username": "customerrotate",
				  "password": "password123"
				}
				""";
		MvcResult customerRegister = mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(customerBody))
				.andExpect(status().isCreated())
				.andReturn();

		JsonNode customerJson = objectMapper.readTree(customerRegister.getResponse().getContentAsString());
		String accessToken = customerJson.path("accessToken").asText();

		mockMvc.perform(post("/api/places/" + place.getId() + "/staff-registration-key/rotate")
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isForbidden());
	}

	@Test
	void loginWithInvalidCredentialsReturns401() throws Exception {
		String loginBody = """
				{
				  "username": "nobody",
				  "password": "wrong"
				}
				""";

		mockMvc.perform(post("/api/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(loginBody))
				.andExpect(status().isUnauthorized());
	}

	private String seedPlaceWithKey(String name) {
		String plainKey = staffRegistrationKeyService.generatePlainKey();
		Place place = Place.builder()
				.id(UUID.randomUUID())
				.name(name)
				.active(true)
				.staffRegistrationKeyDigest(staffRegistrationKeyService.digest(plainKey))
				.build();
		placeRepository.save(place);
		return plainKey;
	}
}
