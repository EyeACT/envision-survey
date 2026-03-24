<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Get Started",
});

const { loggedIn } = useUserSession();
const userId = useCookie("userId", { refresh: true, maxAge: 60 * 60 * 24 * 30 });

const toast = useToast();
const loading = ref(false);

if (loggedIn.value || userId.value) {
  toast.add({
    title: "Session Exists",
    color: "warning",
    description:
      "You already have a Reviewer ID. Use it to continue your session.",
    icon: "material-symbols:warning",
  });
  await navigateTo("/login?message=session_exists");
}

async function generate() {
  loading.value = true;

  await $fetch("/api/auth/signup", { method: "POST" })
    .then(({ id }) => {
      userId.value = id;
      navigateTo(`/login?token=${id}`);
    })
    .catch((error) => {
      toast.add({
        title: "Error generating ID",
        color: "error",
        description: error.data?.statusMessage ?? "Unknown error",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<template>
  <UCard class="w-full max-w-lg bg-white/75 backdrop-blur dark:bg-white/5">
    <div class="w-full px-4 py-5 sm:p-6">
      <div class="flex flex-col items-center justify-center">
        <h2 class="my-1 text-2xl font-bold">Get a Reviewer ID</h2>
        <p class="text-center text-sm text-balance text-gray-500">
          Your ID will be saved on your device. Keep it to continue your reviews
          across sessions and devices.
        </p>
      </div>

      <UButton
        class="mt-6 flex w-full justify-center"
        :loading="loading"
        @click="generate"
      >
        Get Reviewer ID
      </UButton>
    </div>

    <template #footer>
      <p class="text-center text-sm">
        Click the button to generate a unique Reviewer ID for your anonymous
        submissions. This ID is not linked to any personal information,
        ensuring your privacy while allowing your reviews to be tracked across
        sessions.
      </p>
    </template>
  </UCard>
</template>
