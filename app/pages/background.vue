<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Reviewer Background" });

const state = reactive({
  careerLevel: '',
  primaryBackground: '',
  imagingFamiliarity: ''
});

const loading = ref(false);
const toast = useToast();

const canSubmit = computed(() => 
  state.careerLevel.trim() && 
  state.primaryBackground.trim() && 
  state.imagingFamiliarity.trim()
);

async function onSubmit() {
  loading.value = true;
  try {
    await $fetch('/api/user/background', {
      method: 'POST',
      body: state
    });
    await navigateTo('/survey');
  } catch (err) {
    toast.add({ title: 'Error saving profile', color: 'red' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-white font-sans antialiased text-slate-900">
    <header class="border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-30">
      <div class="mx-auto max-w-[1400px] flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="h-9 w-9 flex items-center justify-center rounded bg-slate-800 text-white font-bold text-sm">
            <UIcon name="i-heroicons-user" class="w-5 h-5" />
          </div>
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Initial Onboarding</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1000px] px-6 py-12">

      <div class="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        <div class="p-10 space-y-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4">
            Professional Profile
          </h3>
          
          <div class="space-y-8">
            <div>
              <label class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-2 block">Career Level</label>
              <UInput 
                v-model="state.careerLevel" 
                placeholder="e.g., student, postdoc, faculty, clinician, other..." 
                size="xl" 
                variant="outline"
                class="w-full"
              />
            </div>

            <div>
              <label class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-2 block">Primary Background</label>
              <UInput 
                v-model="state.primaryBackground" 
                placeholder="e.g., research, clinical, both..." 
                size="xl" 
                variant="outline"
                class="w-full"
              />
            </div>

            <div>
              <label class="text-[10px] font-bold text-[#00897b] uppercase tracking-widest mb-2 block">Familiarity with ophthalmic imaging data</label>
              <UInput 
                v-model="state.imagingFamiliarity" 
                placeholder="e.g., none, some, regular..." 
                size="xl" 
                variant="outline"
                class="w-full"
              />
            </div>
          </div>

          <div class="pt-6">
            <button @click="onSubmit" :disabled="!canSubmit || loading" 
              class="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-30"
              :class="canSubmit ? 'bg-slate-800 text-white shadow-md hover:bg-slate-900' : 'bg-slate-100 text-slate-400'">
              {{ loading ? 'Saving Profile...' : 'Complete & Start Survey' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>