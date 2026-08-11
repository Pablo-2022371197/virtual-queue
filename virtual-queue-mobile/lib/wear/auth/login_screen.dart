import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wear_plus/wear_plus.dart';

import '../../core/auth/auth_service.dart';
import '../../core/errors/api_exception.dart';
import '../wear_safe_area.dart';
import 'pin_storage.dart';
import 'wear_text_input.dart';

/// Uses Android Wear RemoteInput instead of Flutter TextField. The Wear IME
/// owns the full-screen editor and returns only text explicitly confirmed.
class WearLoginScreen extends ConsumerStatefulWidget {
  const WearLoginScreen({super.key});

  @override
  ConsumerState<WearLoginScreen> createState() => _WearLoginScreenState();
}

class _WearLoginScreenState extends ConsumerState<WearLoginScreen> {
  String _username = '';
  String _password = '';
  bool _openingInput = false;
  bool _loading = false;
  bool _submitting = false;
  String? _error;

  Future<void> _openUsername() async {
    await _requestText(
      label: 'Usuario o correo',
      onAccepted: (value) => _username = value,
    );
  }

  Future<void> _openPassword() async {
    await _requestText(
      label: 'Contraseña',
      onAccepted: (value) => _password = value,
    );
  }

  Future<void> _requestText({
    required String label,
    required ValueChanged<String> onAccepted,
  }) async {
    if (_openingInput || _loading) return;
    setState(() {
      _openingInput = true;
      _error = null;
    });
    try {
      final value = await WearTextInput.request(label: label);
      if (value != null && mounted) {
        setState(() => onAccepted(value));
      }
    } on PlatformException catch (error) {
      debugPrint('[WearLogin] RemoteInput error: ${error.code}');
      if (mounted) {
        setState(() => _error = 'No se pudo abrir el teclado del reloj');
      }
    } finally {
      if (mounted) setState(() => _openingInput = false);
    }
  }

  Future<void> _submit() async {
    if (_loading || _submitting) return;
    _submitting = true;

    final username = _username.trim();
    final password = _password;

    debugPrint(
      '[WearLogin] submit userLen=${username.length} passLen=${password.length}',
    );

    if (username.isEmpty) {
      _submitting = false;
      setState(() => _error = 'Ingresa usuario o correo');
      return;
    }
    if (password.isEmpty) {
      _submitting = false;
      setState(() => _error = 'Ingresa tu contraseña');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(authStateProvider.notifier).login(
            username: username,
            password: password,
          );
      if (!mounted) return;

      final user = ref.read(authStateProvider).user;
      final userId = user?.id ?? '';
      final hasDecision =
          userId.isNotEmpty && await PinStorage.hasPinDecision(userId);
      if (!mounted) return;

      if (!hasDecision) {
        context.go('/wear/pin/setup');
      } else {
        final hasPin =
            await PinStorage.hasPin(scope: PinScope.wear, userId: userId);
        if (!mounted) return;
        context.go(hasPin ? '/wear/pin/verify' : '/wear/home');
      }
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (error, stack) {
      debugPrint('[WearLogin] unexpected error: $error\n$stack');
      if (mounted) setState(() => _error = 'No se pudo iniciar sesión');
    } finally {
      _submitting = false;
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AmbientMode(
      builder: (context, mode, child) {
        return Scaffold(
          backgroundColor: Colors.black,
          resizeToAvoidBottomInset: true,
          body: WearSafeArea(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 220),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Iniciar sesión',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _inputButton(
                    label: 'Usuario o correo',
                    value: _username,
                    icon: Icons.person_outline,
                    onPressed: _openUsername,
                  ),
                  const SizedBox(height: 8),
                  _inputButton(
                    label: 'Contraseña',
                    value: _password.isEmpty
                        ? ''
                        : List.filled(_password.length, '•').join(),
                    icon: Icons.lock_outline,
                    onPressed: _openPassword,
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontSize: 10,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed:
                          _loading || _openingInput ? null : _submit,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      child: _loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text(
                              'Entrar',
                              style: TextStyle(fontSize: 13),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _inputButton({
    required String label,
    required String value,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    final hasValue = value.isNotEmpty;

    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: _openingInput || _loading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
          side: const BorderSide(color: Colors.white38),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: Colors.white70),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 9,
                    ),
                  ),
                  Text(
                    hasValue ? value : 'Toca para escribir',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: hasValue ? Colors.white : Colors.white38,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.edit_outlined, size: 14, color: Colors.white54),
          ],
        ),
      ),
    );
  }
}
