import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
        }}
      />
      <Stack.Screen
        name="leads-list"
        options={{
          headerShown: false,
          title: "All Leads",
        }}
      />
      <Stack.Screen
        name="lead-detail"
        options={{
          headerShown: false,
          title: "Lead Details",
        }}
      />
      <Stack.Screen
        name="properties-list"
        options={{
          headerShown: false,
          title: "Properties",
        }}
      />
      <Stack.Screen
        name="projects-list"
        options={{
          headerShown: false,
          title: "Real Estate Projects",
        }}
      />
      <Stack.Screen
        name="project-detail"
        options={{
          headerShown: false,
          // title: "Project Details",
        }}
      />
    </Stack>
  );
}
