<template>
  <div
    v-if="user.contributor.admin"
    class="row standard-page"
  >
    <div class="well">
      <h1>Admin Panel</h1>

      <div class="row">
        <form
          class="form-inline"
          @submit.prevent="loadHero(heroID)"
        >
          <input
            v-model="heroID"
            class="form-control"
            type="text"
            :placeholder="'User ID or Username; blank for your account'"
            :style="{ 'min-width': '45ch' }"
          >
          <input
            type="submit"
            value="Load User (click or hit enter)"
            class="btn btn-secondary"
          >
        </form>
      </div>

      <div
        v-if="hero && hero.profile"
        class="row"
      >
        <div class="form col-12">
          <basic-details
            :user-id="hero._id"
            :auth="hero.auth"
            :preferences="hero.preferences"
            :profile="hero.profile"
          />

          <privileges-and-gems
            :hero="hero"
            :reset-counter="resetCounter"
          />

          <cron-and-auth
            :auth="hero.auth"
            :preferences="hero.preferences"
            :last-cron="hero.lastCron"
            :reset-counter="resetCounter"
          />

          <party-and-quest
            :user-id="hero._id"
            :username="hero.auth.local.username"
            :user-has-party="hasParty"
            :party-not-exist-error="partyNotExistError"
            :user-party-data="hero.party"
            :group-party-data="party"
            :reset-counter="resetCounter"
          />

          <avatar-and-drops
            :items="hero.items"
            :preferences="hero.preferences"
          />

          <items-owned
            :hero="hero"
            :reset-counter="resetCounter"
          />

          <div class="accordion">
            <div
              class="accordion-group"
              heading="Update Items"
            >
              <h3
                class="expand-toggle"
                :class="{'open': expandUpdateItems}"
                @click="expandUpdateItems = !expandUpdateItems"
              >
                Update Items
              </h3>
              <div
                v-if="expandUpdateItems"
                class="form-group"
              >
                <p>
                  TIP: First find the item in the "Items" section above and
                  click its "Change" button.
                  The item path and current value (if any) will be inserted below.
                </p>
                <form @submit.prevent="saveHeroOld()">
                  <div>
                    <input
                      v-model="hero.itemPath"
                      class="form-control"
                      type="text"
                    >
                    <small class="muted">
                      Enter the <strong>item path</strong>. E.g.,
                      <code>items.pets.BearCub-Zombie</code> or
                      <code>items.gear.owned.head_special_0</code> or
                      <code>items.gear.equipped.head</code>.
                      You can find all the items in the "Item" section above.
                      The "Change" buttons will insert the path and the current value automatically.
                    </small>
                  </div>
                  <div>
                    <input
                      v-model="hero.itemVal"
                      class="form-control"
                      type="text"
                      placeholder="Value (eg, 5)"
                    >
                    <small class="muted">
                      Enter the <strong>item value</strong>. E.g.,
                      <code>5</code> or
                      <code>false</code> or
                      <code>head_warrior_3</code>.
                    </small>
                  </div>
                  <input
                    type="submit"
                    value="Save"
                    class="btn btn-primary"
                  >
                </form>
              </div>
            </div>
          </div>

          <contributor-details
            :hero="hero"
            :reset-counter="resetCounter"
            @clear-data="clearData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .accordion-group .accordion-group {
    margin-left: 1em;
  }
  h3 {
    margin-top: 2em;
  }
  h4 {
    margin-top: 1em;
  }
  .expand-toggle::after {
    margin-left: 5px;
  }
  .subsection-start {
    margin-top: 1em;
  }
  .form-inline {
    margin-bottom: 1em;
    input, span {
      margin-left: 5px;
    }
  }
  .errorMessage {
    font-weight: bold;
  }
</style>

<script>
// XXX_SOON purge below
import markdownDirective from '@/directives/markdown';
import styleHelper from '@/mixins/styleHelper';
import { mapState } from '@/libs/store';
import content from '@/../../common/script/content';
import notifications from '@/mixins/notifications';

import BasicDetails from './user-support/basicDetails';
import ItemsOwned from './user-support/itemsOwned';
import CronAndAuth from './user-support/cronAndAuth';
import PartyAndQuest from './user-support/partyAndQuest';
import AvatarAndDrops from './user-support/avatarAndDrops';
import PrivilegesAndGems from './user-support/privilegesAndGems';
import ContributorDetails from './user-support/contributorDetails';

export default {
  components: {
    BasicDetails,
    ItemsOwned,
    CronAndAuth,
    PartyAndQuest,
    AvatarAndDrops,
    PrivilegesAndGems,
    ContributorDetails,
  },
  directives: {
    markdown: markdownDirective, // XXX_SOON is this needed?
  },
  mixins: [notifications, styleHelper], // XXX_SOON is this needed?
  data () {
    return { // XXX_SOON delete expandUpdateItems and maybe others
      resetCounter: 0,
      hero: {},
      heroID: '',
      party: {},
      hasParty: false,
      partyNotExistError: false,
      content,
      expandUpdateItems: false,
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
  },
  methods: {
    clearData: function clearData () {
      this.hero = {};
    },

    async loadHero (id) {
      let uuid = id || this.user._id;
      uuid = uuid.replace(/@/, ''); // allow "@name" to be entered
      const hero = await this.$store.dispatch('hall:getHero', { uuid });
      this.hero = { ...hero };

      if (!this.hero.flags) {
        this.hero.flags = {
          chatRevoked: false,
          chatShadowMuted: false,
        };
      }

      this.hasParty = false;
      this.partyNotExistError = false;
      if (this.hero.party && this.hero.party._id) {
        let party;
        try {
          party = await this.$store.dispatch('hall:getHeroParty', { groupId: this.hero.party._id });
          this.hasParty = true;
          this.party = { ...party };
        } catch (e) {
          // the API's error message isn't worth reporting ("Request failed with status code 404")
          this.partyNotExistError = true;
        }
      }

      // XXX_SOON delete from below
      // collapse all sections except those with errors
      this.expandUpdateItems = false;
      this.resetCounter += 1; // tell child components to reinstantiate from scratch
    },
    async saveHeroOld () { // XXX_SOON delete eventually
      this.hero.contributor.admin = this.hero.contributor.level > 7;
      await this.$store.dispatch('hall:updateHero', { heroDetails: this.hero });
      this.text('User updated');
      this.hero = {};
      // this.heroID = ''; // uncomment if we want to clear the search box after saving
    },
  },
};
// XXX delete committed lint changes
</script>
