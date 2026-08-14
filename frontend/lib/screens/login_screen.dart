import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/branch.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../utils/turkish_date.dart';
import '../widgets/pressable_scale.dart';

enum _Mode { login, register }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  _Mode _mode = _Mode.login;

  // Giriş Yap
  final _loginFormKey = GlobalKey<FormState>();
  final _loginEmailCtrl = TextEditingController();
  final _loginPassCtrl = TextEditingController();
  bool _loginObscure = true;
  String? _loginError;

  // Kayıt Ol
  final _registerFormKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  DateTime? _birthday;
  bool _registerObscure = true;
  bool _birthdayTouched = false;
  UserRole _role = UserRole.customer;
  String? _branch;
  String? _registerError;

  @override
  void dispose() {
    _loginEmailCtrl.dispose();
    _loginPassCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickBirthday() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000, 1, 1),
      firstDate: DateTime(1930),
      lastDate: DateTime.now(),
      helpText: 'Doğum Tarihini Seç',
    );
    if (picked != null) setState(() => _birthday = picked);
  }

  void _submitLogin() async {
    setState(() => _loginError = null);
    final formOk = _loginFormKey.currentState?.validate() ?? false;
    if (!formOk) return;

    final error = await context.read<AppState>().loginWithCredentials(
      email: _loginEmailCtrl.text,
      password: _loginPassCtrl.text,
    );
    if (error != null) {
      if (mounted) setState(() => _loginError = error);
      return;
    }
    if (mounted) Navigator.of(context).pop();
  }

  void _submitRegister(String defaultBranch) async {
    setState(() {
      _birthdayTouched = true;
      _registerError = null;
    });
    final formOk = _registerFormKey.currentState?.validate() ?? false;
    if (!formOk || _birthday == null) return;

    final error = await context.read<AppState>().register(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      password: _passCtrl.text,
      birthDate: _birthday!,
      selectedRole: _role,
      branch: _branch ?? defaultBranch,
    );
    if (error != null) {
      if (mounted) setState(() => _registerError = error);
      return;
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final branches = context.watch<AppState>().branches;
    _branch ??= branches.firstOrNull?.id;

    return Scaffold(
      backgroundColor: EmarColors.oat,
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: EmarColors.espresso,
            padding: EdgeInsets.fromLTRB(
              20,
              MediaQuery.of(context).padding.top + 8,
              20,
              24,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  borderRadius: BorderRadius.circular(999),
                  onTap: () => Navigator.of(context).pop(),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(
                      Icons.arrow_back,
                      color: EmarColors.surface,
                      size: 22,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'EMAR Kafe',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontSize: 34,
                    color: EmarColors.surface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Doğru dem, doğru an.',
                  style: TextStyle(
                    color: EmarColors.surface.withValues(alpha: 0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: EmarColors.oatDark,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _ModeTab(
                            label: 'Giriş Yap',
                            selected: _mode == _Mode.login,
                            onTap: () => setState(() => _mode = _Mode.login),
                          ),
                        ),
                        Expanded(
                          child: _ModeTab(
                            label: 'Kayıt Ol',
                            selected: _mode == _Mode.register,
                            onTap: () => setState(() => _mode = _Mode.register),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 260),
                    transitionBuilder: (child, anim) => FadeTransition(
                      opacity: anim,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, 0.03),
                          end: Offset.zero,
                        ).animate(anim),
                        child: child,
                      ),
                    ),
                    child: _mode == _Mode.login
                        ? _buildLoginForm(key: const ValueKey('login'))
                        : _buildRegisterForm(
                            branches,
                            key: const ValueKey('register'),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm({required Key key}) {
    return Form(
      key: _loginFormKey,
      child: Column(
        key: key,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _loginEmailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'E-posta'),
            validator: (v) {
              if (v == null || !v.contains('@') || !v.contains('.')) {
                return 'Geçerli bir e-posta gir';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _loginPassCtrl,
            obscureText: _loginObscure,
            decoration: InputDecoration(
              labelText: 'Şifre',
              suffixIcon: IconButton(
                icon: Icon(
                  _loginObscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: EmarColors.espresso.withValues(alpha: 0.5),
                ),
                onPressed: () => setState(() => _loginObscure = !_loginObscure),
              ),
            ),
            validator: (v) => (v == null || v.length < 6) ? 'Şifre en az 6 karakter olmalı' : null,
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Bu özellik demo sürümünde yok')),
              ),
              child: const Text(
                'Şifremi unuttum?',
                style: TextStyle(fontSize: 12),
              ),
            ),
          ),
          if (_loginError != null) ...[
            const SizedBox(height: 4),
            Text(
              _loginError!,
              style: const TextStyle(
                color: EmarColors.paprikaDim,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 22),
          PressableScale(
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitLogin,
                child: const Text('Giriş Yap'),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterForm(List<Branch> branches, {required Key key}) {
    return Form(
      key: _registerFormKey,
      child: Column(
        key: key,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: 'Ad Soyad'),
            validator: (v) =>
                (v == null || v.trim().length < 2) ? 'Adını gir' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'E-posta'),
            validator: (v) {
              if (v == null || !v.contains('@') || !v.contains('.')) {
                return 'Geçerli bir e-posta gir';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Telefon Numarası'),
            validator: (v) =>
                (v == null || v.trim().length < 10) ? 'Geçerli bir telefon numarası gir' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _passCtrl,
            obscureText: _registerObscure,
            decoration: InputDecoration(
              labelText: 'Şifre',
              suffixIcon: IconButton(
                icon: Icon(
                  _registerObscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: EmarColors.espresso.withValues(alpha: 0.5),
                ),
                onPressed: () =>
                    setState(() => _registerObscure = !_registerObscure),
              ),
            ),
            validator: (v) =>
                (v == null || v.length < 6) ? 'En az 6 karakter olmalı' : null,
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: _pickBirthday,
            borderRadius: BorderRadius.circular(14),
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: '🎂  Doğum Tarihi',
                errorText: (_birthdayTouched && _birthday == null)
                    ? 'Doğum tarihini seç'
                    : null,
              ),
              child: Text(
                _birthday == null ? 'Seçilmedi' : formatTurkishDate(_birthday!),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Doğum gününde seni özel bir sürprizle karşılayacağız 🎂',
            style: TextStyle(
              fontSize: 12,
              color: EmarColors.espresso.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 22),
          Text('Şube', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _branch,
            items: branches
                .map((b) => DropdownMenuItem(value: b.id, child: Text(b.name)))
                .toList(),
            onChanged: (v) => setState(() => _branch = v ?? _branch),
          ),
          const SizedBox(height: 22),
          Text('Rol (demo)', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(
            'Gerçek uygulamada rol yönetim tarafından atanır; burada akışları test etmek için seçebilirsin.',
            style: TextStyle(
              fontSize: 11.5,
              color: EmarColors.espresso.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: UserRole.values.map((r) {
              final selected = r == _role;
              return ChoiceChip(
                label: Text(r.label),
                selected: selected,
                onSelected: (_) => setState(() => _role = r),
                selectedColor: EmarColors.paprika,
                labelStyle: TextStyle(
                  color: selected ? EmarColors.surface : EmarColors.espresso,
                  fontWeight: FontWeight.w700,
                ),
              );
            }).toList(),
          ),
          if (_registerError != null) ...[
            const SizedBox(height: 14),
            Text(
              _registerError!,
              style: const TextStyle(
                color: EmarColors.paprikaDim,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: 24),
          PressableScale(
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _submitRegister(branches.first.id),
                child: const Text('Hesap Oluştur'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ModeTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(11),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? EmarColors.espresso : Colors.transparent,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: selected
                  ? EmarColors.surface
                  : EmarColors.espresso.withValues(alpha: 0.6),
            ),
          ),
        ),
      ),
    );
  }
}
