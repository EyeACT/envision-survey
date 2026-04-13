<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({
  title: "ENVISION | Expert Validation Survey",
});

// Fetch the user's current profile status
const { data: userProfile } = await useFetch('/api/user/me');

const handleBeginClick = async () => {
  // Check if the required background fields are filled
  if (userProfile.value?.careerLevel) {
    await navigateTo('/survey');
  } else {
    await navigateTo('/background');
  }
};

const guidelines = ref([
  {
    title: "Project Background",
    description: "ENVISION is a NIH-funded initiative to curate the world's eye imaging data. We've processed 4,700+ records; your review provides the 'ground truth' to validate our AI classifier.",
    icon: "i-lucide-microscope",
  },
  {
    title: "Your Task",
    description: "Review metadata for clinical records and rate your confidence that it contains imaging (OCT, Fundus, etc.). Each record takes 1–3 minutes.",
    icon: "i-lucide-clipboard-check",
  },
  {
    title: "Save & Resume",
    description: "Your progress is linked to your Expert ID. You can close this window at any time and resume exactly where you left off by logging back in.",
    icon: "i-lucide-save",
  },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">

    <main class="max-w-4xl mx-auto px-6 py-12">
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-4">
        <div class="p-10 border-b border-slate-50">
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Survey
          </h1>
          <p class="text-lg text-slate-600 leading-relaxed max-w-2xl">
            Thank you for participating in the ENVISION project. This survey collects independent ground-truth labels to measure classifier performance and identify systematic errors in ophthalmic data curation.
          </p>
        </div>

        <div class="p-10 bg-slate-50/50">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <UButton
              @click="handleBeginClick"
              size="xl"
              label="Begin Survey Task"
              icon="i-lucide-play"
              class="!rounded-xl !px-10 !py-4 !bg-[#00897b] hover:!bg-[#00796b] !shadow-lg !shadow-[#00897b]/20"
            />
            <div class="text-sm text-slate-500 font-medium">
              Total estimated time: ~2–5 hours
            </div>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6 mb-4">
        <div v-for="(item, i) in guidelines" :key="i" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 bg-[#e0f2f1] text-[#00897b] rounded-lg flex items-center justify-center mb-4">
            <UIcon :name="item.icon" class="w-6 h-6" />
          </div>
          <h3 class="font-bold text-slate-900 mb-2">{{ item.title }}</h3>
          <p class="text-xs text-slate-500 leading-relaxed">{{ item.description }}</p>
        </div>
      </div>

      <footer class="flex flex-col md:flex-row justify-between items-center gap-6 py-10 border-t border-slate-200">
        <div class="text-sm text-slate-500">
          Questions or technical issues? Contact <span class="font-bold text-slate-700">James O’Neill</span>
        </div>
        <div class="flex gap-4">
          <UButton
            label="Email Support"
            to="mailto:joneill@calmi2.org"
            variant="ghost"
            icon="i-lucide-mail"
            color="gray"
            size="xs"
          />
        </div>
      </footer>
    </main>
  </div>
</template>