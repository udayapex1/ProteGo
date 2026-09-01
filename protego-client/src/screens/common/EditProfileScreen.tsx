import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../context/AlertContext';
import { useAppTheme } from '../../context/ThemeContext';
import { userApi } from '../../api/user.api';

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUserProfile } = useAuth();
  const { alert } = useAppAlert();
  const { theme } = useAppTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const nextName = name.trim();
    const nextEmail = email.trim().toLowerCase();

    if (nextName.length < 2 || nextName.length > 80) {
      alert('Invalid name', 'Name must be between 2 and 80 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const updated = await userApi.updateProfile({ name: nextName, email: nextEmail });
      await updateUserProfile({ name: updated.name, email: updated.email });
      alert('Profile updated', 'Your profile has been updated successfully.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      alert('Update failed', error.response?.data?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Update the details used on your Protego account.</Text>

        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="words"
          style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}
        />

        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 36 },
  title: { fontSize: 17, fontWeight: '600' },
  content: { padding: 24 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  label: { fontSize: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 20 },
  saveButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
