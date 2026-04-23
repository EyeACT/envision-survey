<script setup lang="ts">

useSeoMeta({
  title: "ENVISION | Eye Imaging Dataset Classification Survey",
});

const { data: userProfile } = await useFetch('/api/user/me');

const handleBeginClick = async () => {
  if (userProfile.value?.careerLevel) {
    await navigateTo('/survey');
  } else {
    await navigateTo('/background');
  }
};

const workflowSteps = [
  {
    title: "Generate a Reviewer ID",
    description: "Choose Start Reviewing to create an anonymous ID. Keep this ID to continue later on any device."
  },
  {
    title: "Review each record",
    description: "On the survey page, inspect the metadata and answer whether it describes an eye imaging dataset."
  },
  {
    title: "Submit and continue",
    description: "Clicking Yes, No, or I cannot tell saves your response and moves to the next record automatically."
  }
];
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
    <main class="max-w-4xl mx-auto px-6 py-16">
      
      <div class="text-center mb-16">
        <p class="text-[10px] font-bold text-[#00897b] uppercase tracking-[0.2em] mb-3">Reviewer Guide</p>
        <h1 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-8">
          Eye Imaging Dataset Classification Survey
        </h1>
        <div class="flex justify-center">
          <UButton
            @click="handleBeginClick"
            size="xl"
            label="Start Reviewing"
            icon="i-lucide-play"
            class="!rounded-xl !px-12 !py-4 !bg-[#00897b] hover:!bg-[#00796b] !shadow-xl !shadow-[#00897b]/20 transition-all transform hover:scale-105"
          />
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 md:p-12 mb-10 space-y-6">
        <p class="text-[15px] leading-relaxed text-slate-600">
          Thank you for taking the time to participate in this survey. We truly appreciate your contribution.
        </p>
        <p class="text-[15px] leading-relaxed text-slate-600">
          This survey is being conducted as part of the development of the Envision Portal, a platform aimed at improving the discoverability and reuse of eye imaging data. This work is carried out by the FAIR Data Innovations Hub.
        </p>
        <p class="text-[15px] leading-relaxed text-slate-600">
          The purpose of this survey is to conduct human review of records to determine whether they describe an eye imaging dataset or not. The results will support the development of an AI model that performs this classification automatically from text metadata and will be used to identify true eye imaging datasets from mislabeled records (papers, tables, software, unrelated datasets, etc.) before they are indexed in the Envision Portal.
        </p>
        <p class="text-[15px] leading-relaxed text-slate-600">
          Although you can complete the survey at any time, we would appreciate it if you could complete at least 100 evaluations (or more, if you can; there are 356 evaluations in total). You will be provided with a Reviewer ID when you first start, and you can use it to come back to the survey at any time, including from a different device, and continue where you left off.
        </p>
        <p class="text-[15px] leading-relaxed text-slate-600">
          Please note that this survey is completely anonymous. We do not collect any personal identifiable information. Each respondent is assigned a random unique ID, which allows us to compute aggregate statistics when reporting results in future publications.
        </p>
        <p class="text-[15px] leading-relaxed text-slate-600">
          If you have any questions, feedback, or would like to learn more about this work, please feel free to reach out at <a href="mailto:bpatel@calmi2.org" class="text-[#00897b] font-bold hover:underline">bpatel@calmi2.org</a>.
        </p>
      </div>

      <div class="bg-[#e0f2f1] border border-[#b2dfdb] rounded-2xl p-10 text-center mb-10 shadow-sm">
        <h2 class="text-xl font-bold text-slate-900 mb-3">Before You Begin</h2>
        <p class="text-[15px] text-slate-700 max-w-2xl mx-auto leading-relaxed">
          You can start fresh with a new Reviewer ID or resume with an existing one. The survey asks the same core question for each record: Does this record describe an eye imaging dataset?
        </p>
      </div>

      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Review Workflow</h2>
            <p class="text-xs text-slate-500">Follow these steps to complete your session.</p>
          </div>
          <UIcon name="i-lucide-list-checks" class="w-5 h-5 text-slate-300" />
        </div>
        
        <div class="p-8 space-y-6">
          <div v-for="(step, i) in workflowSteps" :key="i" class="flex gap-5 group">
            <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-[#00897b] flex items-center justify-center text-xs font-black transition-colors group-hover:bg-[#00897b] group-hover:text-white">
              {{ i + 1 }}
            </div>
            
            <div class="flex-1">
              <h3 class="text-sm font-bold text-slate-900 mb-1">{{ step.title }}</h3>
              <p class="text-sm text-slate-500 leading-relaxed">
                {{ step.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer class="flex flex-col md:flex-row justify-between items-center gap-6 py-12 mt-12 border-t border-slate-200">
        <div class="text-sm text-slate-500">
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