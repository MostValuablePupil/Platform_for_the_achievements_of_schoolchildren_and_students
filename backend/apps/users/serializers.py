# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import dumps
from .models import Avatar, Specialty
from apps.portfolio.serializers import UserBadgeSerializer
from apps.skills.models import UserSkill

User = get_user_model()


def send_verification_email(user):
    token = dumps(user.pk, salt='email-confirm')
    verify_url = f"{settings.FRONTEND_URL}/verify-email/{token}"

    html_message = f"""
    <html>
    <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Платформа достижений</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#1e1b4b;font-size:20px;">Подтвердите вашу почту</h2>
                  <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.6;">
                    Привет, <strong>{user.first_name or user.username}</strong>!
                  </p>
                  <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.6;">
                    Для завершения регистрации нажмите кнопку ниже. Ссылка действительна <strong>24 часа</strong>.
                  </p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="{verify_url}"
                           style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
                                  padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
                          Подтвердить email
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:32px 0 0;color:#9ca3af;font-size:13px;line-height:1.6;">
                    Если кнопка не работает, скопируйте ссылку в браузер:<br>
                    <a href="{verify_url}" style="color:#4f46e5;word-break:break-all;">{verify_url}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;text-align:center;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    Если вы не регистрировались на платформе — просто проигнорируйте это письмо.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    return send_mail(
        subject='Подтвердите вашу почту — Платформа достижений',
        message=f'Для активации аккаунта перейдите по ссылке: {verify_url}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True,
    )


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'code', 'name']


class UserSkillSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='skill.name')
    category = serializers.ReadOnlyField(source='skill.category.name')

    class Meta:
        model = UserSkill
        fields = ['id', 'name', 'category', 'experience', 'level']


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ['id', 'name', 'image']


class UserSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='user-detail', read_only=True)
    avatar_details = AvatarSerializer(source='avatar', read_only=True)
    specialty_details = SpecialtySerializer(source='specialty', read_only=True)
    earned_badges = UserBadgeSerializer(source='badges', many=True, read_only=True)
    competencies = UserSkillSerializer(many=True, read_only=True)

    password = serializers.CharField(write_only=True, required=False, min_length=8)
    achievements_count = serializers.IntegerField(read_only=True)

    # Поле только для регистрации куратора — не сохраняется в БД
    curator_registration_code = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="Секретный код, обязательный при регистрации куратора"
    )

    class Meta:
        model = User
        fields = [
            'id', 'url', 'username', 'first_name', 'last_name', 'email',
            'role', 'educational_institution', 'course', 'specialty', 'specialty_details', 'total_xp', 'level',
            'avatar', 'avatar_details', 'earned_badges', 'password', 'competencies', 'future_profession',
            'achievements_count', 'curator_registration_code', 'organization', 'city',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, attrs):
        is_update = self.instance is not None
        if is_update:
            return attrs

        role = attrs.get('role', User.Role.STUDENT)
        if role == User.Role.CURATOR:
            provided_code = attrs.get('curator_registration_code', '').strip()
            expected_code = getattr(settings, 'CURATOR_REGISTRATION_CODE', '')
            if not provided_code:
                raise serializers.ValidationError(
                    {'curator_registration_code': 'Для регистрации куратора необходимо указать секретный код.'}
                )
            if provided_code != expected_code:
                raise serializers.ValidationError(
                    {'curator_registration_code': 'Неверный секретный код. Регистрация куратора невозможна.'}
                )
        if role == User.Role.EMPLOYER and not attrs.get('organization', '').strip():
            raise serializers.ValidationError(
                {'organization': 'Это поле обязательно для работодателя.'}
            )
        if role == User.Role.STUDENT and not attrs.get('city', '').strip():
            raise serializers.ValidationError(
                {'city': 'Это поле обязательно для студентов и школьников.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('curator_registration_code', None)
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Пароль обязателен при регистрации.'})
        validated_data['username'] = validated_data.get('email')
        user = User.objects.create_user(**validated_data, password=password, is_active=False)

        if not send_verification_email(user):
            user.delete()
            raise serializers.ValidationError(
                {'email': 'Не удалось отправить письмо. Проверьте правильность email-адреса.'}
            )

        return user

    def update(self, instance, validated_data):
        # При обновлении код куратора игнорируем
        validated_data.pop('curator_registration_code', None)
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
