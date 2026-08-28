import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth';

/** Entry point: send people to the tabs or the sign-in screen. */
export default function Index() {
  const { isSignedIn } = useAuth();
  return <Redirect href={isSignedIn ? '/(tabs)' : '/login'} />;
}
