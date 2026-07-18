import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:wear_plus/wear_plus.dart';

import 'biometric_service.dart';
import 'pin_storage.dart';
import 'session_manager.dart';

enum PinMode { setup, verify }

class PinScreen extends StatefulWidget {
  final PinMode mode;
  const PinScreen({super.key, required this.mode});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _input = '';
  String? _firstPin;
  String? _error;
  int _failedAttempts = 0;
  bool _blocked = false;
  int _blockSeconds = 30;
  Timer? _blockTimer;
  bool _biometricAvailable = false;
  bool _biometricAttempted = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  @override
  void dispose() {
    _blockTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkBiometric() async {
    final avail = await BiometricService.isAvailable();
    if (mounted) {
      setState(() => _biometricAvailable = avail);
    }
  }

  void _onDigit(String digit) {
    if (_blocked) return;
    if (_input.length >= 4) return;
    setState(() {
      _error = null;
      _input += digit;
    });
    if (_input.length == 4) {
      _submit();
    }
  }

  void _onDelete() {
    if (_blocked) return;
    if (_input.isEmpty) return;
    setState(() {
      _input = _input.substring(0, _input.length - 1);
      _error = null;
    });
  }

  Future<void> _submit() async {
    if (_input.length != 4) return;

    if (widget.mode == PinMode.setup) {
      if (_firstPin == null) {
        setState(() {
          _firstPin = _input;
          _input = '';
        });
      } else {
        if (_input == _firstPin) {
          await PinStorage.savePin(_input);
          if (mounted) {
            SessionManager.startSession();
            context.go('/wear/home');
          }
        } else {
          setState(() {
            _error = 'Los PIN no coinciden';
            _firstPin = null;
            _input = '';
          });
        }
      }
    } else {
      final valid = await PinStorage.verifyPin(_input);
      if (valid) {
        if (mounted) {
          SessionManager.startSession();
          context.go('/wear/home');
        }
      } else {
        setState(() {
          _failedAttempts++;
          _input = '';
          _error = 'PIN incorrecto';
        });
        if (_failedAttempts >= 3) {
          _startBlock();
        }
      }
    }
  }

  void _startBlock() {
    setState(() {
      _blocked = true;
      _blockSeconds = 30;
      _error = 'Demasiados intentos';
    });
    _blockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_blockSeconds <= 1) {
        timer.cancel();
        if (mounted) {
          setState(() {
            _blocked = false;
            _failedAttempts = 0;
            _error = null;
          });
        }
      } else {
        setState(() => _blockSeconds--);
      }
    });
  }

  Future<void> _authenticateBiometric() async {
    if (_biometricAttempted) return;
    setState(() => _biometricAttempted = true);
    final ok = await BiometricService.authenticate();
    if (ok && mounted) {
      SessionManager.startSession();
      context.go('/wear/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSetup = widget.mode == PinMode.setup;
    final title = isSetup
        ? (_firstPin == null ? 'Configurar PIN' : 'Confirmar PIN')
        : 'Ingresar PIN';
    final subtitle = isSetup && _firstPin != null ? 'Ingresa el PIN nuevamente' : null;

    return AmbientMode(
      builder: (context, mode, child) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: Colors.black,
            textTheme: const TextTheme(
              bodyMedium: TextStyle(color: Colors.white),
              bodySmall: TextStyle(color: Colors.white70),
            ),
          ),
          home: Scaffold(
            backgroundColor: Colors.black,
            body: SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (subtitle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white70,
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  // PIN dots display
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(4, (i) {
                      final filled = i < _input.length;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: filled ? Colors.white : Colors.white24,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 8),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        _blocked
                            ? 'Bloqueado $_blockSeconds s'
                            : _error!,
                        style: TextStyle(
                          fontSize: 14,
                          color: _blocked ? Colors.orange : Colors.redAccent,
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  // Numeric keypad 3x4
                  _buildKeypad(),
                  const SizedBox(height: 8),
                  if (widget.mode == PinMode.verify &&
                      _biometricAvailable &&
                      !_biometricAttempted)
                    TextButton.icon(
                      onPressed: _authenticateBiometric,
                      icon: const Icon(Icons.fingerprint,
                          color: Colors.white70, size: 20),
                      label: const Text(
                        'Huella',
                        style: TextStyle(color: Colors.white70),
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

  Widget _buildKeypad() {
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
                _KeypadButton(
                  label: digit,
                  onTap: _blocked ? null : () => _onDigit(digit),
                ),
            ],
          ),
        // Last row: empty, 0, delete
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(width: 72),
            _KeypadButton(
              label: '0',
              onTap: _blocked ? null : () => _onDigit('0'),
            ),
            _KeypadButton(
              label: '⌫',
              onTap: _blocked ? null : _onDelete,
            ),
          ],
        ),
      ],
    );
  }
}

class _KeypadButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;

  const _KeypadButton({required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 72,
        height: 48,
        alignment: Alignment.center,
        margin: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white12,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 24,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
