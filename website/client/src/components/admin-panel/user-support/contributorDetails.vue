<template>
  <div class="accordion-group">
    <h3
      class="expand-toggle"
      :class="{'open': expand}"
      @click="expand = !expand"
    >
      Contributor Details
    </h3>
    <div v-if="expand"><!-- XXX expand when user has a tier -->

			<form @submit.prevent="saveHero()">
				<div class="form-group form-inline">
					<label>Title</label>
					<input
						v-model="contributor.text"
						class="form-control"
						type="text"
						:style="{ 'min-width': '50ch' }"
					>
					<small>
						Common titles:
						<strong>Ambassador, Artisan, Bard, Blacksmith, Challenger, Comrade, Fletcher,
							Linguist, Linguistic Scribe, Scribe, Socialite, Storyteller</strong>.
					</small>
					<small>
						Rare titles:
						Advisor, Chamberlain, Designer, Mathematician, Shirtster, Spokesperson,
						Statistician, Tinker, Transcriber, Troubadour.
					</small>
				</div>
				<div class="form-group form-inline">
					<label>Tier</label>
					<input
						v-model="contributor.level"
						class="form-control"
						type="number"
						:style="{ 'width': '10ch' }"
					>
					<small>
						1-7 for normal contributors, 8 for moderators, 9 for staff.
						This determines which items, pets, mounts are available, and name-tag coloring.
						Tiers 8 and 9 are automatically given admin status.
					</small>
				</div>
				<div class="form-group">
					<label>Contributions</label>
					<textarea
						v-model="contributor.contributions"
						class="form-control"
						cols="5"
						rows="5"
					></textarea>
				</div>
				<input
					type="submit"
					value="Save"
					class="btn btn-primary"
				>
			</form>

    </div>
  </div>

</template>

<script>
function resetData (self) {
  self.expand = self.contributor.level;
}

export default {
  props: {
    resetCounter: {
      type: Number,
      required: true,
    },
    contributor: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      expand: false,
    };
  },
  watch: {
    resetCounter () {
      resetData(this);
    },
  },
  mounted () {
    resetData(this);
  },
  methods: {
    // authMethodExists (authMethod) { // XXX delete
      // if (this.auth[authMethod] && this.auth[authMethod].length !== 0) return true;
      // return false;
    // },
  },
};
</script>
