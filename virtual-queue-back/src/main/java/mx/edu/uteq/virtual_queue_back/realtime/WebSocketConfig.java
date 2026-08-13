package mx.edu.uteq.virtual_queue_back.realtime;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import mx.edu.uteq.virtual_queue_back.security.CustomUserDetailsService;
import mx.edu.uteq.virtual_queue_back.security.JwtService;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final JwtService jwtService;
	private final CustomUserDetailsService userDetailsService;

	@Value("${app.cors.allowed-origins}")
	private String allowedOrigins;

	public WebSocketConfig(JwtService jwtService, CustomUserDetailsService userDetailsService) {
		this.jwtService = jwtService;
		this.userDetailsService = userDetailsService;
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic", "/queue");
		registry.setApplicationDestinationPrefixes("/app");
		registry.setUserDestinationPrefix("/user");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		List<String> origins = List.of(allowedOrigins.split(","));
		String[] allowed = origins.stream().map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);

		// Native WebSocket (Flutter Wear / mobile): no browser Origin.
		registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
		// SockJS for the web SPA — keep CORS origins from ALLOWED_ORIGINS.
		registry.addEndpoint("/ws").setAllowedOrigins(allowed).withSockJS();
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(new ChannelInterceptor() {
			@Override
			public Message<?> preSend(Message<?> message, MessageChannel channel) {
				StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
				if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
					String authHeader = accessor.getFirstNativeHeader("Authorization");
					if (authHeader != null && authHeader.startsWith("Bearer ")) {
						String token = authHeader.substring(7);
						if (jwtService.isValid(token)) {
							String username = jwtService.extractUsername(token);
							UserDetails userDetails = userDetailsService.loadUserByUsername(username);
							accessor.setUser(new UsernamePasswordAuthenticationToken(
									userDetails, null, userDetails.getAuthorities()));
						}
					}
				}
				return message;
			}
		});
	}
}
