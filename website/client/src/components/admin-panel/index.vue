<template>
  <div
    v-if="user.contributor.admin"
    class="row standard-page"
  >
    <div class="well">
      <h1>Admin Panel</h1>

      <router-link :to="{'name': 'adminPanelUser', 'params': {'userIdentifier': 'alys'}}">
        alys
      </router-link>
      <router-link :to="{'name': 'adminPanelUser', 'params': {'userIdentifier': 'alys1'}}">
        alys1
      </router-link>
      <router-link :to="{'name': 'adminPanelUser', 'params': {'userIdentifier': 'alys2'}}">
        alys2
      </router-link>

      <div class="row">
        <form
          class="form-inline"
          @submit.prevent="getHeroFromForm(userIdentifier)"
        >
          <input
            v-model="userIdentifier"
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
  .markdownPreview {
    margin-left: 3em;
    margin-top: 1em;
  }
</style>

<script>
import { mapState } from '@/libs/store';

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
  data () {
    return {
      resetCounter: 0,
      hero: {},
      userIdentifier: '',
      previousIdentifier: '',
      party: {},
      hasParty: false,
      partyNotExistError: false,
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
  },
  beforeRouteUpdate (to, from, next) {
    // we navigated to the admin-panel page from the same page with a different user in the URL
    console.error('beforeRouteUpdate - from ap to ap, different user in URL');
    this.$root.$emit('habitica::dismiss-modal', 'profile'); // XXX not use here?
    this.getHeroFromUrl(to.params.userIdentifier || ''); // is await and async needed?
    next(); // XXX move this to getHeroFromUrl() ?
  },
  // beforeRouteEnter (to, from, next) {
    // alert('Enter');
    // console.log(to, from, next);
    // called when the route that renders this component is about to
    // be navigated away from.
    // has access to `this` component instance.
  // },
  // beforeRouteLeave (to, from, next) {
    // alert('leave');
    // console.log(to, from, next);
    // called when the route that renders this component is about to
    // be navigated away from.
    // has access to `this` component instance.
  // },
  mounted () {
    // we have navigated to the admin-panel page from a different page
    // or have reloaded the admin-panel page
    console.error('mounted - reloaded ap page, or gone from any other page to ap with or without user in URL');
    this.$root.$emit('habitica::dismiss-modal', 'profile'); // XXX not use here?
    this.getHeroFromUrl(this.$route.params.userIdentifier || ''); // is await and async needed?
  },
  methods: {
    clearData (clearUserIdentifier) {
      if (clearUserIdentifier) {
        console.error('clearData - with clear ID');
      } else {
        console.error('clearData - withOUT clear id');
      }
      this.hero = {};

      // Clear the userIdentifier from the entry form
      if (clearUserIdentifier) {
        this.userIdentifier = '';
        this.previousIdentifier = ''; // XXX always want that?
        // NB it's not always desired (e.g., the admin may want to re-type an incorrect Username)
      }
    },

    // getHeroFromForm (userIdentifier = this.user._id) // XXX use this instead of "let id"
    getHeroFromForm (userIdentifier) {
      // We have specified the user to load by one of these:
      // - entering the User ID / Username in the form (`userIdentifier`)
      // - submitting the form with no identifier to load the admin's own data.
      let id;
      if (userIdentifier) {
        id = userIdentifier;
        console.error(`getHeroFromForm - entered ${id}`);
      } else {
        id = this.user._id;
        console.error(`getHeroFromForm - LEFT BLANK: ${id}`);
      }
      // console.error(`MAYBE RELOAD: ${this.previousIdentifier} -> ${userIdentifier}`);
      // this.fetchOrReloadUserData(userIdentifier); // XXX need await and async?
      this.fetchOrReloadUserData(id); // XXX USE ABOVE INSTEAD
      // this.$router.push(`/admin-panel/${id}`); // XXX still want this? Need it anywhere else?
    },

    getHeroFromUrl (userIdentifier) {
      if (userIdentifier) {
        console.error(`getHeroFromUrl - ${userIdentifier}`);
        // we have navigated from the admin-panel page to the same page with a user specified
        // XXX is that comment true now?
        this.fetchOrReloadUserData(userIdentifier); // XXX need await and async?
        // XXX UPTOHERE for same user reloaded - may not need to do anything here
        // XXX check if go from one user to same user
        // XXX check if enter non-existent user
      } else {
        console.error('getHeroFromUrl - no id -> clear data (and id)'); // XXX need the id??
        this.clearData(true); // XXX if this is bad when coming from a different page,
        // need to pass in a "samePage" boolean from beforeRouteUpdate
        // otherwise just comment that it's in case we've gone from admin-panel to admin-panel eg:
        // we have navigated from the admin-panel page to the same page but with no user specified
      }
    },

    fetchOrReloadUserData (userIdentifier) {
      console.error(`1 / 2: fetchOrReloadUserData - ${userIdentifier}`);
      // XXX ensure that the other code means userIdentifier can't be empty
      // userIdentifier can be User ID or Username

      // close modal in case the page was opened from the modal // XXX move elsewhere?
      this.$root.$emit('habitica::dismiss-modal', 'profile'); // XXX does it throw error if no modal

      let id = userIdentifier;
      id = id.replace(/@/, ''); // allow "@Username" to be entered
      this.userIdentifier = id;
      // XXX have to set id into form here?

      if (this.previousIdentifier && id === this.previousIdentifier) { // XXX before strip @?
        console.error('2a / 2: fetchOrReloadUserData - reload');
        // allow the same user to be reloaded
        // (e.g., if the admin changes their mind about edits they made)
        // XXX UPTOHERE for same user reloaded
        // console.error(`RELOAD - ${this.previousIdentifier} -> ${id}`);
        this.$router.go(); // reload the same user
        // XXX this fails for case where entered nothing in form because it just reloads.
        // XXX UPTOHERE - instead of reload, see that it is the same user -> clear data and refetch?
        // XXX for router.go Ensure url is used? Or is that not important?
        // XXX or move router.go to URL-only function?
      } else {
        console.error('2b / 2: fetchOrReloadUserData - no reload');
        this.previousIdentifier = id;
        this.loadHero(userIdentifier); // XXX is await and async needed?
        // XXX in $router.push use router name not hard-coded url
        // We load the user by changing the URL so that we have consistent URL behaviour
        // regardless of whether the user identifier is typed or accessed from a link.
      }
    },

    async loadHero (userIdentifier) {
      console.error(`loadHero - ${userIdentifier}`);
      try {
        const hero = await this.$store.dispatch('hall:getHero', { uuid: userIdentifier });
        this.hero = { ...hero };
      } catch (err) {
        // e.g., non-existent user // XXX test
        // console.error('4: err');
        console.error('loadHero - error -> clearData (not clear id)');
        this.clearData();
      }

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

      this.resetCounter += 1; // tell child components to reinstantiate from scratch
    },
  },
};
</script>
