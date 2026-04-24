<script setup lang="ts">
useSeoMeta({
  title: "ENVISION | Eye Imaging Dataset Classification Survey",
});

const { data: userProfile } = await useFetch("/api/user/me");

const handleBeginClick = async () => {
  if (userProfile.value?.careerLevel) {
    await navigateTo("/survey");
  } else {
    await navigateTo("/background");
  }
};

const workflowSteps = [
  {
    title: "Generate a Reviewer ID",
    description:
      "Choose Start Reviewing to create an anonymous ID. Keep this ID to continue later on any device.",
  },
  {
    title: "Review each record",
    description:
      "On the survey page, inspect the metadata and answer whether it describes an eye imaging dataset.",
  },
  {
    title: "Submit and continue",
    description:
      "Clicking Yes, No, or I cannot tell saves your response and moves to the next record automatically.",
  },
];
</script>

<template>
  <div
    class="min-h-screen bg-slate-50 pb-20 font-sans antialiased dark:bg-gray-900"
  >
    <main class="mx-auto max-w-4xl px-6 py-16">
      <div class="mb-16 text-center">
        <p
          class="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#00897b] uppercase"
        >
          Reviewer Guide
        </p>
        <h1 class="mb-8 text-4xl font-black tracking-tight md:text-5xl">
          Eye Imaging Dataset Classification Survey
        </h1>
        <div class="flex justify-center">
          <UButton
            @click="handleBeginClick"
            size="xl"
            label="Start Reviewing"
            icon="i-lucide-play"
            class="transform !rounded-xl !bg-[#00897b] !px-12 !py-4 !shadow-xl !shadow-[#00897b]/20 transition-all hover:scale-105 hover:!bg-[#00796b]"
          />
        </div>
      </div>

      <div
        class="mb-10 space-y-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm md:p-12 dark:border-gray-700 dark:bg-gray-800"
      >
        <p class="text-[15px] leading-relaxed">
          Thank you for taking the time to participate in this survey. We truly
          appreciate your contribution.
        </p>
        <p class="text-[15px] leading-relaxed">
          This survey is being conducted as part of the development of the
          Envision Portal, a platform aimed at improving the discoverability and
          reuse of eye imaging data. This work is carried out by the FAIR Data
          Innovations Hub.
        </p>
        <p class="text-[15px] leading-relaxed">
          The purpose of this survey is to conduct human review of records to
          determine whether they describe an eye imaging dataset or not. The
          results will support the development of an AI model that performs this
          classification automatically from text metadata and will be used to
          identify true eye imaging datasets from mislabeled records (papers,
          tables, software, unrelated datasets, etc.) before they are indexed in
          the Envision Portal.
        </p>
        <p class="text-[15px] leading-relaxed">
          Although you can complete the survey at any time, we would appreciate
          it if you could complete at least 100 evaluations (or more, if you
          can; there are 356 evaluations in total). You will be provided with a
          Reviewer ID when you first start, and you can use it to come back to
          the survey at any time, including from a different device, and
          continue where you left off.
        </p>
        <p class="text-[15px] leading-relaxed">
          Please note that this survey is completely anonymous. We do not
          collect any personal identifiable information. Each respondent is
          assigned a random unique ID, which allows us to compute aggregate
          statistics when reporting results in future publications.
        </p>
        <p class="text-[15px] leading-relaxed">
          If you have any questions, feedback, or would like to learn more about
          this work, please feel free to reach out at
          <a
            href="mailto:bpatel@calmi2.org"
            class="font-bold text-[#00897b] hover:underline"
            >bpatel@calmi2.org</a
          >.
        </p>
      </div>

      <div
        class="mb-10 rounded-2xl border border-[#b2dfdb] bg-[#e0f2f1] p-10 text-center shadow-sm dark:border-[#00695c] dark:bg-[#004d40]"
      >
        <h2 class="mb-3 text-xl font-bold">Before You Begin</h2>
        <p class="mx-auto max-w-2xl text-[15px] leading-relaxed">
          You can start fresh with a new Reviewer ID or resume with an existing
          one. The survey asks the same core question for each record: Does this
          record describe an eye imaging dataset?
        </p>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <div>
            <h2 class="text-lg font-bold">Review Workflow</h2>
            <p class="text-xs">Follow these steps to complete your session.</p>
          </div>
          <UIcon name="i-lucide-list-checks" class="h-5 w-5 text-slate-300" />
        </div>

        <div class="space-y-6 p-8">
          <div
            v-for="(step, i) in workflowSteps"
            :key="i"
            class="group flex gap-5"
          >
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-[#00897b] transition-colors group-hover:bg-[#00897b] group-hover:text-white dark:bg-gray-700"
            >
              {{ i + 1 }}
            </div>

            <div class="flex-1">
              <h3 class="mb-1 text-sm font-bold">{{ step.title }}</h3>
              <p class="text-sm leading-relaxed">
                {{ step.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer
        class="mt-12 flex flex-col items-center justify-between gap-6 border-t border-slate-200 py-12 md:flex-row dark:border-gray-700"
      >
        <div class="text-sm">
          Questions or technical issues? Contact by sending email to
        </div>
        <div class="flex flex-wrap justify-center gap-4">
          <UButton
            label="James O'Neill"
            to="mailto:joneill@calmi2.org"
            variant="ghost"
            icon="i-lucide-mail"
            color="gray"
            size="xs"
            class="hover:text-[#00897b]"
          />
          <UButton
            label="Bhavesh Patel"
            to="mailto:bPatel@calmi2.org"
            variant="ghost"
            icon="i-lucide-mail"
            color="gray"
            size="xs"
            class="hover:text-[#00897b]"
          />
        </div>
      </footer>
    </main>
  </div>
</template>
