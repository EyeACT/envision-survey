<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Professional Profile | ENVISION" });

const state = reactive({
  careerLevel: '',
  otherCareer: '',
  primaryBackground: '',
  otherBackground: '',
  imagingFamiliarity: null as number | null,
  experienceYears: ''
});

const careerItems = [
  { value: 'Undergraduate student', label: 'Undergraduate student' },
  { value: 'Graduate student', label: 'Graduate student' },
  { value: 'Postdoctoral researcher / clinical fellow', label: 'Postdoctoral researcher / clinical fellow' },
  { value: 'Resident', label: 'Resident' },
  { value: 'Early-career', label: 'Early-career' },
  { value: 'Mid-career', label: 'Mid-career' },
  { value: 'Senior / Principal Investigator', label: 'Senior / Principal Investigator' },
  { value: 'Industry professional', label: 'Industry professional' },
  { value: 'Other', label: 'Other' }
];

const backgroundItems = [
  { value: 'Ophthalmology (clinical)', label: 'Ophthalmology (clinical)' },
  { value: 'Optometry (clinical)', label: 'Optometry (clinical)' },
  { value: 'Vision science / Visual Neuroscience', label: 'Vision science / Visual Neuroscience' },
  { value: 'Biomedical / Clinical Informatics', label: 'Biomedical / Clinical Informatics' },
  { value: 'Computer Science / Machine Learning / AI', label: 'Computer Science / Machine Learning / AI' },
  { value: 'Biomedical / Imaging Engineering', label: 'Biomedical / Imaging Engineering' },
  { value: 'Bioinformatics / Computational Biology', label: 'Bioinformatics / Computational Biology' },
  { value: 'Health Data Science / Epidemiology', label: 'Health Data Science / Epidemiology' },
  { value: 'Other', label: 'Other' }
];

const experienceItems = [
  { value: '0-2 years', label: '0-2 years' },
  { value: '2-5 years', label: '2-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10-20 years', label: '10-20 years' },
  { value: '20+ years', label: '20+ years' }
];

const familiarityItems = [
  { value: 0, label: 'None', description: 'No prior exposure' },
  { value: 1, label: 'Basic', description: 'General awareness' },
  { value: 2, label: 'Working', description: 'Used in research/coursework' },
  { value: 3, label: 'Substantial', description: 'Regular part of work' },
  { value: 4, label: 'Expert', description: 'Primary focus/Publish in field' }
];

const radioCustomUi = {
  item: {
    base: 'border border-slate-200 p-3.5 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-center min-h-[58px]',
    active: 'border-[#00897b] bg-[#e0f2f1] text-[#00897b] ring-1 ring-[#00897b]'
  },
  label: 'text-slate-900 font-bold text-sm tracking-tight', 
  description: 'text-slate-500 text-[10px] font-semibold italic mt-0.5'
};

const canSubmit = computed(() => {
  const isCareerValid = state.careerLevel === 'Other' ? state.otherCareer.trim() !== '' : !!state.careerLevel;
  const isBackgroundValid = state.primaryBackground === 'Other' ? state.otherBackground.trim() !== '' : !!state.primaryBackground;
  return isCareerValid && isBackgroundValid && !!state.experienceYears && state.imagingFamiliarity !== null;
});

async function onSubmit() {
  const selectedFam = familiarityItems.find(i => i.value === state.imagingFamiliarity);
  const payload = {
    careerLevel: state.careerLevel === 'Other' ? state.otherCareer : state.careerLevel,
    primaryBackground: state.primaryBackground === 'Other' ? state.otherBackground : state.primaryBackground,
    imagingFamiliarity: `${selectedFam?.label}: ${selectedFam?.description}`,
    imagingFamiliarityScore: state.imagingFamiliarity,
    experienceYears: state.experienceYears
  };

  try {
    await $fetch('/api/user/background', { method: 'POST', body: payload });
    await navigateTo('/survey');
  } catch (err) {
    console.error("Save error", err);
  }
}
</script>

<template>
  <div class="min-h-screen bg-white font-sans antialiased text-slate-900">
    <main class="mx-auto max-w-[1500px] px-6 py-12">
      <div class="w-full border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden flex flex-col">
        
        <div class="px-10 py-8 border-b border-slate-100 bg-white">
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight leading-tight">Professional Profile</h1>
          <p class="text-slate-600 text-[13px] leading-relaxed mt-1">Please provide your background details to personalize your survey experience.</p>
        </div>

        <div class="p-10 space-y-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            <div class="col-span-1 lg:col-span-3">
              <UFormField>
                <template #label>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest">01. Career Level</span>
                    <span class="text-red-500 font-bold">*</span>
                  </div>
                </template>
                <URadioGroup v-model="state.careerLevel" :items="careerItems" :ui="radioCustomUi" class="space-y-2.5" />
                <UInput v-if="state.careerLevel === 'Other'" v-model="state.otherCareer" placeholder="Specify..." class="mt-3" size="sm" />
              </UFormField>
            </div>

            <div class="col-span-1 lg:col-span-3">
              <UFormField>
                <template #label>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest">02. Primary Background</span>
                    <span class="text-red-500 font-bold">*</span>
                  </div>
                </template>
                <URadioGroup v-model="state.primaryBackground" :items="backgroundItems" :ui="radioCustomUi" class="space-y-2.5" />
                <UInput v-if="state.primaryBackground === 'Other'" v-model="state.otherBackground" placeholder="Specify..." class="mt-3" size="sm" />
              </UFormField>
            </div>

            <div class="col-span-1 lg:col-span-3">
              <UFormField>
                <template #label>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest">03. Experience</span>
                    <span class="text-red-500 font-bold">*</span>
                  </div>
                </template>
                <URadioGroup v-model="state.experienceYears" :items="experienceItems" :ui="radioCustomUi" class="space-y-2.5" />
              </UFormField>
            </div>

            <div class="col-span-1 lg:col-span-3">
              <UFormField>
                <template #label>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest">04. Imaging Familiarity</span>
                    <span class="text-red-500 font-bold">*</span>
                  </div>
                </template>
                <URadioGroup v-model="state.imagingFamiliarity" :items="familiarityItems" :ui="radioCustomUi" class="space-y-2.5" />
              </UFormField>
            </div>
          </div>

          <div class="pt-8 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 -mx-10 -mb-10 p-10">
            <button 
              type="button"
              @click="onSubmit" 
              :disabled="!canSubmit" 
              class="px-16 py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-sm"
              :class="canSubmit ? 'bg-[#00897b] text-white hover:bg-[#00796b]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
            >
              Start Survey
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>