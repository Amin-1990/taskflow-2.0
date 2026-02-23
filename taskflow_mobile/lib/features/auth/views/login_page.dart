import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_config.dart';
import '../../../core/constants/design_constants.dart';
import '../../../core/widgets/tap_scale.dart';
import '../controllers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final notifier = ref.read(authProvider.notifier);
    final result = await notifier.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (!mounted) {
      return;
    }

    if (result == null) {
      final message = ref.read(authProvider).error ?? 'Connexion impossible.';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.7),
            radius: 1.2,
            colors: [Color(0xFF0F234B), AppPalette.backgroundDark],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    IconButton(
                      onPressed: () => context.push('/server-config'),
                      icon: const Icon(Icons.settings,
                          color: AppPalette.textSecondary),
                      tooltip: 'Parametres serveur',
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const _BrandHeader(),
                const SizedBox(height: 48),
                _LoginCard(
                  formKey: _formKey,
                  emailController: _emailController,
                  passwordController: _passwordController,
                  obscurePassword: _obscurePassword,
                  isLoading: authState.isLoading,
                  onTogglePassword: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                  onSubmit: _submit,
                ),
                const SizedBox(height: 72),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.help_outline, color: AppPalette.textMuted),
                    SizedBox(width: 8),
                    Text('Besoin d\'aide ?',
                        style: TextStyle(
                            color: AppPalette.textMuted, fontSize: 16)),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  AppConfig.appVersionLabel,
                  style: TextStyle(color: Color(0xFF5F739A), fontSize: 15),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _HexagonLogo(size: 36),
            SizedBox(width: 12),
            Text(
              'Taskflow',
              style: TextStyle(
                color: Colors.white,
                fontSize: 52 / 1.4,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.6,
              ),
            ),
          ],
        ),
        SizedBox(height: 8),
        Text(
          'MOBILE PRODUCTION SUITE',
          style: TextStyle(
            color: AppPalette.textSecondary,
            fontSize: 20 / 1.4,
            letterSpacing: 1.1,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _LoginCard extends StatefulWidget {
  const _LoginCard({
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.obscurePassword,
    required this.isLoading,
    required this.onTogglePassword,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool obscurePassword;
  final bool isLoading;
  final VoidCallback onTogglePassword;
  final VoidCallback onSubmit;

  @override
  State<_LoginCard> createState() => _LoginCardState();
}

class _LoginCardState extends State<_LoginCard> {
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();

  @override
  void dispose() {
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF17253C),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppPalette.borderDark, width: 1.3),
        boxShadow: const [
          BoxShadow(
              color: Color(0x44000000), blurRadius: 22, offset: Offset(0, 10)),
        ],
      ),
      child: Form(
        key: widget.formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Text('Bienvenue',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 38 / 1.4,
                      fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 6),
            const Center(
              child: Text(
                'Veuillez vous authentifier pour continuer',
                style: TextStyle(color: AppPalette.textSecondary, fontSize: 16),
              ),
            ),
            const SizedBox(height: 22),
            const Text('Identifiant', style: _labelStyle),
            const SizedBox(height: 8),
            _FocusField(
              controller: widget.emailController,
              focusNode: _emailFocus,
              keyboardType: TextInputType.emailAddress,
              hint: 'j.dupont@usine.com',
              icon: Icons.person,
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) {
                  return 'Saisissez votre identifiant.';
                }
                if (!text.contains('@') && text.length < 3) {
                  return 'Identifiant invalide.';
                }
                return null;
              },
            ),
            const SizedBox(height: 18),
            const Text('Mot de passe', style: _labelStyle),
            const SizedBox(height: 8),
            _FocusField(
              controller: widget.passwordController,
              focusNode: _passwordFocus,
              hint: '....................',
              icon: Icons.lock,
              obscureText: widget.obscurePassword,
              suffix: IconButton(
                onPressed: widget.onTogglePassword,
                icon: Icon(
                  widget.obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: AppPalette.textSecondary,
                ),
              ),
              validator: (value) => (value ?? '').isEmpty
                  ? 'Saisissez votre mot de passe.'
                  : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {},
                child: const Text('Mot de passe oublie ?',
                    style: TextStyle(color: AppPalette.primary, fontSize: 15)),
              ),
            ),
            const SizedBox(height: 4),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: TapScale(
                onTap: widget.isLoading ? null : widget.onSubmit,
                child: ElevatedButton(
                  onPressed: widget.isLoading ? null : widget.onSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppPalette.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 8,
                    shadowColor: const Color(0x66135BEC),
                  ),
                  child: widget.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Se connecter',
                                style: TextStyle(
                                    fontSize: 20 / 1.4,
                                    fontWeight: FontWeight.w700)),
                            SizedBox(width: 10),
                            _ArrowPulse(),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static const _labelStyle = TextStyle(
    color: Color(0xFFD7E4FB),
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );
}

class _FocusField extends StatefulWidget {
  const _FocusField({
    required this.controller,
    required this.focusNode,
    required this.hint,
    required this.icon,
    this.validator,
    this.keyboardType,
    this.suffix,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String hint;
  final IconData icon;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final Widget? suffix;
  final bool obscureText;

  @override
  State<_FocusField> createState() => _FocusFieldState();
}

class _FocusFieldState extends State<_FocusField> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_onFocusChanged);
  }

  @override
  void didUpdateWidget(covariant _FocusField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      oldWidget.focusNode.removeListener(_onFocusChanged);
      widget.focusNode.addListener(_onFocusChanged);
    }
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocusChanged);
    super.dispose();
  }

  void _onFocusChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final focused = widget.focusNode.hasFocus;
    final iconColor = focused ? AppPalette.primary : const Color(0xFF6D85AB);
    return TextFormField(
      controller: widget.controller,
      focusNode: widget.focusNode,
      keyboardType: widget.keyboardType,
      obscureText: widget.obscureText,
      style: const TextStyle(color: AppPalette.textPrimary, fontSize: 16),
      decoration: InputDecoration(
        hintText: widget.hint,
        hintStyle: const TextStyle(color: Color(0xFF607A9E), fontSize: 16),
        prefixIcon: Icon(widget.icon, color: iconColor),
        suffixIcon: widget.suffix,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        filled: true,
        fillColor: const Color(0xFF1A2D4B),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF2E4B78), width: 1.3),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF2E4B78), width: 1.3),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.6),
        ),
      ),
      validator: widget.validator,
    );
  }
}

class _ArrowPulse extends StatefulWidget {
  const _ArrowPulse();

  @override
  State<_ArrowPulse> createState() => _ArrowPulseState();
}

class _ArrowPulseState extends State<_ArrowPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(4 * _controller.value, 0),
          child: child,
        );
      },
      child: const Icon(Icons.arrow_forward_rounded, size: 26),
    );
  }
}

class _HexagonLogo extends StatelessWidget {
  const _HexagonLogo({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _HexagonPainter(),
    );
  }
}

class _HexagonPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppPalette.primary;
    final path = Path();
    final radius = size.width / 2;

    for (var i = 0; i < 6; i++) {
      final angle = (math.pi / 180) * (60 * i - 30);
      final x = radius + radius * math.cos(angle);
      final y = radius + radius * math.sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
