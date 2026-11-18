import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:virtual_queue_core/virtual_queue_core.dart';

import '../../theme/turnix_theme.dart';
import '../../widgets/support_icon_button.dart';
import 'login_validators.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _loading) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref.read(coreAuthStateProvider.notifier).login(
            username: _usernameController.text.trim(),
            password: _passwordController.text,
          );

      final user = ref.read(coreAuthStateProvider).user;
      if (user == null || !canUsePhoneApp(user.role)) {
        await ref.read(coreAuthStateProvider.notifier).logout();
        setState(() {
          _error =
              'Esta aplicación es solo para clientes (CUSTOMER). Usa la web para personal o administración.';
        });
        return;
      }

      if (mounted) context.go('/home');
    } on ApiException catch (error) {
      setState(() {
        _error = error.isUnauthorized
            ? 'Credenciales inválidas.'
            : error.message;
      });
    } catch (_) {
      setState(() {
        _error = 'No fue posible iniciar sesión. Revisa tu conexión.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8),
            child: SupportIconButton(),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Turnix',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: TurnixColors.accent,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Tu turno, en tu bolsillo.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: TurnixColors.muted,
                              ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Iniciar sesión',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Accede con tu cuenta de cliente.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: TurnixColors.muted,
                              ),
                        ),
                        const SizedBox(height: 20),
                        TextFormField(
                          controller: _usernameController,
                          decoration: const InputDecoration(
                            labelText: 'Usuario o correo',
                            hintText: 'customer',
                          ),
                          textInputAction: TextInputAction.next,
                          enabled: !_loading,
                          validator: validateLoginUsername,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          enabled: !_loading,
                          decoration: InputDecoration(
                            labelText: 'Contraseña',
                            suffixIcon: IconButton(
                              onPressed: () {
                                setState(() => _obscurePassword = !_obscurePassword);
                              },
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                            ),
                          ),
                          validator: validateLoginPassword,
                          onFieldSubmitted: (_) => _submit(),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                              fontSize: 14,
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: _loading
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Entrar'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
