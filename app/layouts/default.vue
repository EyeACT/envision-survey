<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const userId = useCookie("userId", {
  refresh: true,
  maxAge: 60 * 60 * 24 * 30,
});

const copyToClipboard = async () => {
  if (userId.value) {
    await navigator.clipboard.writeText(userId.value);
    useToast().add({
      title: "Copied to clipboard",
      color: "success",
      description: `Your ID: ${userId.value}`,
      icon: "material-symbols:check-circle-outline",
    });
  }
};

const footerItems: NavigationMenuItem[] = [
  {
    label: "Made by FAIR Data Innovations Hub",
    to: "https://fairdataihub.org",
    target: "_blank",
  },
];
</script>

<template>
  <div>
    <UHeader>
      <template #title>
        <NuxtLink to="/"> Envision Survey
 </NuxtLink>
      </template>

      <template #right>
        <UTooltip text="Click to copy" mode="hover" v-if="userId">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-clipboard-document-20-solid"
            class="text-xs"
            :label="userId ? `Reviewer ID: ${userId}` : 'No ID'"
            @click="copyToClipboard"
          />
        </UTooltip>

        <AuthState v-slot="{ loggedIn }">
          <UButton
            v-if="$route.path !== '/survey'"
            to="/survey"
            color="primary"
            class="!bg-[#00897b] hover:!bg-[#00796b]"
          >
            Start Reviewing
            <template #trailing>
              <UIcon name="i-heroicons-arrow-right-20-solid" class="w-5 h-5" />
            </template>
          </UButton>
          <UButton
            v-if="loggedIn"
            color="neutral"
            variant="outline"
            to="/logout"
          >
            Logout
          </UButton>

          <div v-else class="flex items-center justify-center gap-3">
            <UButton to="/login" color="neutral" variant="outline">
              Resume Session
            </UButton>

            <UButton to="/signup" color="neutral">
              <template #trailing>
                <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
              </template>
              Get Started
            </UButton>
          </div>
        </AuthState>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }}
        </p>
      </template>

      <UNavigationMenu :items="footerItems" variant="link" />

      <template #right>
        <UColorModeButton />
      </template>
    </UFooter>
  </div>
</template>
