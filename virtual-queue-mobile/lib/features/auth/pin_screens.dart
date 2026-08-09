import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/auth_service.dart';
import '../../wear/auth/pin_storage.dart';

class PinSetupScreen extends StatefulWidget {
  const PinSetupScreen({super.key, this.optional = false});

  final bool optional;

  @override
  State<PinSetupScreen> createState() => _PinSetupScreenState();
}

class _PinSetupScreenState extends State<PinSetupScreen> {
  String _input = '';
  String? _firstPin;
  String? _error;

  void _onDigit(String digit) {
    if (_input.length >= 4) return;
    setState(() {
      _error = null;
      _input += digit;
    });
    if (_input.length == 4) _submit();
  }

  void _onDelete() {
    if (_input.isEmpty) return;
    setState(() {
      _input = _input.substring(0, _input.length - 1);
      _error = null;
    });
  }

  Future<void> _submit() async {
    if (_firstPin == null) {
      setState(() {
        _firstPin = _input;
        _input = '';
      });
      return;
    }

    if (_input != _firstPin) {
      setState(() {
        _error = 'Los PIN no coinciden';
        _firstPin = null;
        _input = '';
      });
      return;
    }

    await PinStorage.savePin(_input, scope: PinScope.mobile);
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final title = _firstPin == null ? 'Crea un PIN de seguridad' : 'Confirma tu PIN';
    return Scaffold(
      appBar: AppBar(
        title: const Text('PIN de seguridad'),
        actions: [
          if (widget.optional)
            TextButton(
              onPressed: () => context.go('/home'),
              child: const Text('Omitir'),
            ),
        ],
      ),
      body: _buildBody(title),
    );
  }

  Widget _buildBody(String title) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _dots(),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ),
          const Spacer(),
          _keypad(),
        ],
      ),
    );
  }

  Widget _dots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(4, (index) {
        final filled = index < _input.length;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8),
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: filled ? Colors.indigo : Colors.grey.shade300,
          ),
        );
      }),
    );
  }

  Widget _keypad() {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
    ];
    return Column(
      children: [
        for (final row in rows)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (final digit in row)
                _Key(digit: digit, onTap: () => _onDigit(digit)),
            ],
          ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(width: 72),
            _Key(digit: '0', onTap: () => _onDigit('0')),
            _Key(digit: '⌫', onTap: _onDelete),
          ],
        ),
      ],
    );
  }
}

class PinUnlockScreen extends ConsumerStatefulWidget {
  const PinUnlockScreen({super.key});

  @override
  ConsumerState<PinUnlockScreen> createState() => _PinUnlockScreenState();
}

class _PinUnlockScreenState extends ConsumerState<PinUnlockScreen> {
  String _input = '';
  String? _error;
  int _failedAttempts = 0;

  void _onDigit(String digit) {
    if (_input.length >= 4) return;
    setState(() {
      _error = null;
      _input += digit;
    });
    if (_input.length == 4) _submit();
  }

  void _onDelete() {
    if (_input.isEmpty) return;
    setState(() {
      _input = _input.substring(0, _input.length - 1);
      _error = null;
    });
  }

  Future<void> _submit() async {
    final valid = await PinStorage.verifyPin(_input, scope: PinScope.mobile);
    if (!mounted) return;
    if (valid) {
      await ref.read(authStateProvider.notifier).unlock();
      if (mounted) context.go('/home');
      return;
    }
    setState(() {
      _failedAttempts++;
      _error = 'PIN incorrecto';
      _input = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Desbloquear')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Ingresa tu PIN para continuar',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                final filled = index < _input.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: filled ? Colors.indigo : Colors.grey.shade300,
                  ),
                );
              }),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
              ),
            if (_failedAttempts >= 3)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Demasiados intentos. Vuelve a iniciar sesión.',
                  style: TextStyle(color: Colors.orange),
                ),
              ),
            const Spacer(),
            Column(
              children: [
                for (final row in [
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                ])
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (final digit in row)
                        _Key(digit: digit, onTap: () => _onDigit(digit)),
                    ],
                  ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(width: 72),
                    _Key(digit: '0', onTap: () => _onDigit('0')),
                    _Key(digit: '⌫', onTap: _onDelete),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Key extends StatelessWidget {
  const _Key({required this.digit, required this.onTap});

  final String digit;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: SizedBox(
        width: 64,
        height: 64,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(shape: const CircleBorder()),
          child: Text(digit, style: const TextStyle(fontSize: 20)),
        ),
      ),
    );
  }
}
