<template>
  <div
    v-if="user.contributor.admin"
    class="row standard-page"
  >
    <div class="well">
      <h1>Admin Panel</h1>
      <div class="row">
        <div class="form-inline col-12">
          <div class="form-group">
            <input
              v-model="heroID"
              class="form-control"
              type="text"
              :placeholder="'User ID or Username; blank for your account'"
              :style="{ 'min-width': '45ch' }"
              @keyup.enter="loadHero(heroID)"
            >
          </div>
          <div class="form-group">
            <button
              class="btn btn-secondary"
              @click="loadHero(heroID)"
            >
              Load User (click or hit enter)
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="hero && hero.profile"
        class="row"
      >
        <div class="form col-12">
          <h2>@{{ hero.auth.local.username }} &nbsp; / &nbsp; {{ hero.profile.name }}</h2>
          <div class="form-group">
            {{ hero._id }} &nbsp;
            <router-link :to="{'name': 'userProfile', 'params': {'userId': hero._id}}">
              profile link
            </router-link>
          </div>

          <div class="accordion-group">
            <h3
              class="expand-toggle"
              :class="{'open': expandPriv}"
              @click="expandPriv = !expandPriv"
            >
              Privileges, Gem Balance
            </h3>
            <div v-if="expandPriv">
              <div class="form-group">
                <div class="checkbox">
                  <label>
                    <input
                      v-if="hero.flags"
                      v-model="hero.flags.chatShadowMuted"
                      type="checkbox"
                    > Shadow Mute
                  </label>
                </div>
                <div class="checkbox">
                  <label>
                    <input
                      v-if="hero.flags"
                      v-model="hero.flags.chatRevoked"
                      type="checkbox"
                    > Mute (Revoke Chat Privileges)
                  </label>
                </div>
                <div class="checkbox">
                  <label>
                    <input
                      v-model="hero.auth.blocked"
                      type="checkbox"
                    > Ban / Block
                  </label>
                </div>
                <div class="form-inline">
                  <label>Balance</label>
                  <input
                    v-model="hero.balance"
                    class="form-control"
                    type="number"
                    step="0.25"
                    :style="{ 'width': '15ch' }"
                  >
                  <span>
                    <small>
                      Balance is in USD, not in Gems.
                      E.g., if this number is 1, it means 4 Gems.
                      Arrows change Balance by 0.25 (i.e., 1 Gem per click).
                      Do not use when awarding tiers; tier gems are automatic.
                    </small>
                  </span>
                </div>
                <button
                  class="form-control btn btn-primary"
                  @click="saveHero()"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <div class="accordion-group">
            <h3
              class="expand-toggle"
              :class="{'open': expandAuth}"
              @click="expandAuth = !expandAuth"
            >
              Timestamps, Time Zone, Authentication, Email Address
            </h3>
            <div v-if="expandAuth">
              <div>
                Account created:
                <strong>{{ formatDate(hero.auth.timestamps.created) }}</strong>
              </div>
              <div>
                Most recent cron:
                <strong>{{ formatDate(hero.auth.timestamps.loggedin) }}</strong>
              </div>
              <div>
                "lastCron":
                <strong>{{ formatDate(hero.lastCron) }}</strong>
                (if different than above, cron crashed before finishing)
              </div>
              <div class="subsection-start">
                Time zone:
                <strong>{{ formatTimeZone(hero.preferences.timezoneOffset) }}</strong>
              </div>
              <div>
                Time zone at previous cron:
                <strong>{{ formatTimeZone(hero.preferences.timezoneOffsetAtLastCron) }}</strong>
                <br>(if different than above, the user changed zones / daylight savings
                OR has devices on different zones OR uses a VPN with varying zones
                OR something similarly unpleasant is happening)
              </div>
              <div class="subsection-start">
                Local authentication:
                <span v-if="hero.auth.local.email">Yes, &nbsp;
                  <strong>{{ hero.auth.local.email }}</strong></span>
                <span v-else><strong>None</strong></span>
              </div>
              <div>
                Google authentication:
                <pre v-if="authMethodExists('google')">{{ hero.auth.google }}</pre>
                <span v-else><strong>None</strong></span>
              </div>
              <div>
                Facebook authentication:
                <pre v-if="authMethodExists('facebook')">{{ hero.auth.facebook }}</pre>
                <span v-else><strong>None</strong></span>
              </div>
              <div>
                Apple ID authentication:
                <pre v-if="authMethodExists('apple')">{{ hero.auth.apple }}</pre>
                <span v-else><strong>None</strong></span>
              </div>
              <div class="subsection-start">
                Full "auth" object for checking above is correct:
                <pre>{{ hero.auth }}</pre>
              </div>
            </div>
          </div>

          <div class="accordion-group">
            <h3
              class="expand-toggle"
              :class="{'open': expandParty}"
              @click="expandParty = !expandParty"
            >
              Party, Quest
              <span
                v-if="errors.partyOrQuest"
                v-html="errorsHeading"
              ></span>
            </h3>
            <div v-if="expandParty">
              <div>
                <p
                  v-if="errors.partyOrQuest"
                  class="errorMessage"
                  v-html="errors.partyOrQuest"
                ></p>
                Party:
                <span v-if="hasParty">
									yes (party ID {{ hero.party._id }})
									<br>
									<span v-if="isPartyLeader">User is the party leader.</span>
									<span v-else>Party leader is
										<router-link :to="{'name': 'userProfile', 'params': {'userId': party.leader}}">
											{{ party.leader }}
										</router-link>
									</span>
								</span>
                <span v-else>no</span>
              </div>
              <div class="subsection-start">
                <p v-html="questStatus"></p>
                <!-- <pre>{{ TST_1 }}</pre> -->
                <!-- <pre>{{ TST_2 }}</pre> -->
                <!-- <pre>{{ TST_3 }}</pre> -->
              </div>
            </div>
          </div>

          <div class="accordion-group">
            <h3
              class="expand-toggle"
              :class="{'open': expandAvatar}"
              @click="expandAvatar = !expandAvatar"
            >
              Current Avatar Appearance, Drop Count Today
            </h3>
            <div v-if="expandAvatar">
              <div>Drops Today: {{ hero.items.lastDrop.count }}</div>
              <div>Most Recent Drop: {{ formatDate(hero.items.lastDrop.date) }}</div>
              <div>Use Costume: {{ hero.preferences.costume ? 'on' : 'off' }}</div>
              <div class="subsection-start">
                Equipped Gear:
                <ul v-html="formatEquipment(hero.items.gear.equipped)"></ul>
              </div>
              <div>
                Costume:
                <ul v-html="formatEquipment(hero.items.gear.costume)"></ul>
              </div>
            </div>
          </div>

          <div class="accordion-group">
            <h3
              class="expand-toggle"
              :class="{'open': expandItems}"
              @click="expandItems = !expandItems"
            >
              Items
            </h3>
            <div v-if="expandItems">
              <p>
                The sections below display each item's key (bolded if the player has ever owned it),
                followed by the item's English name.
                Use the key (not name!) to change the amount owned or the true/false value.
                Click "Change" to auto-fill "Update Items" with key and current amount/value.
              </p>
              <div
                v-for="itemType in itemTypes"
                :key="itemType"
              >
                <div class="accordion-group">
                  <h4
                    class="expand-toggle"
                    :class="{'open': expandItemType[itemType]}"
                    @click="expandItemType[itemType] = !expandItemType[itemType]"
                  >
                    {{ itemType }}
                  </h4>
                  <div v-if="expandItemType[itemType]">
                    <p v-if="itemType === 'pets'">
                      A value of -1 means they owned the Pet but Released it
                      and have not yet rehatched it.
                    </p>
                    <p v-if="itemType === 'mounts'">
                      A value of NULL means they owned the Mount but Released it
                      and have not yet retamed it.
                    </p>
                    <p v-if="itemType === 'special'">
                      When there are 0 of these items, we can't tell if
                      they had been owned and were all used, or have never been owned.
                    </p>
                    <p v-if="itemType === 'gear'">
                      A value of true means they own the item now and can wear it.
                      A value of false means they used to own it but lost it from Death
                      (or an old Rebirth).
                    </p>

                    <ul>
                      <li
                        v-for="item in collatedItemData[itemType]"
                        :key="item.key"
                        class="form-group form-inline"
                      >
                        <button
                          class="form-control btn btn-primary"
                          @click="changeData(item.path, item.value)"
                        >
                          Change
                        </button>
                        <span>{{ item.valueForDisplay }} : </span>
                        <span :class="{ ownedItem: !item.neverOwned }">{{ item.key }} :</span>
                        <span v-html="item.name"></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                class="form-group well"
              >
                <p>
                  TIP: First find the item in the "Items" section above and
                  click its "Change" button.
                  The item path and current value (if any) will be inserted below.
                </p>
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
                <br>
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
                <div class="form-group">
                  <button
                    class="form-control btn btn-primary"
                    @click="saveHero()"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-group">
            <h3
              class="expand-toggle"
              :class="{'open': expandContrib}"
              @click="expandContrib = !expandContrib"
            >
              Contributor Details
            </h3>
            <div v-if="expandContrib">
              <div class="form-group form-inline">
                <label>Title</label>
                <input
                  v-model="hero.contributor.text"
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
                  v-model="hero.contributor.level"
                  class="form-control"
                  type="number"
                  :style="{ 'width': '10ch' }"
                >
                <small>
                  1-7 for normal contributors, 8 for moderators, 9 for staff.
                  This determines which items, pets, mounts are available, and name-tag coloring.
                  Tiers 8 and 9 are automatically given admin status.
                  <a
                    target="_blank"
                    href="https://trello.com/c/wkFzONhE/277-contributor-gear"
                  >More details (1-7)</a>,&nbsp;
                  <a
                    target="_blank"
                    href="https://github.com/HabitRPG/habitica/issues/3801"
                  >more details (8-9)</a>
                </small>
              </div>
              <div class="form-group">
                <label>Contributions</label>
                <textarea
                  v-model="hero.contributor.contributions"
                  class="form-control"
                  cols="5"
                  rows="5"
                ></textarea>
              </div>
              <div class="form-group">
                <button
                  class="form-control btn btn-primary"
                  @click="saveHero()"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
  .ownedItem {
    font-weight: bold;
  }
  .errorMessage {
    font-weight: bold;
  }
</style>

<script>
import moment from 'moment';

import markdownDirective from '@/directives/markdown';
import styleHelper from '@/mixins/styleHelper';
import { mapState } from '@/libs/store';
import content from '@/../../common/script/content';
import notifications from '@/mixins/notifications';

export default {
  components: {
  },
  directives: {
    markdown: markdownDirective,
  },
  mixins: [notifications, styleHelper],
  data () {
    return {
      hero: {},
      heroID: '',
      party: {},
      hasParty: false,
      isPartyLeader: false,
      TST_1: '',
      TST_2: '',
      TST_3: '',
      questStatus: '',
      content,
      collatedItemData: {},
      expandPriv: false,
      expandAuth: false,
      expandParty: false,
      expandAvatar: false,
      expandItems: false,
      expandItemType: {
        eggs: false,
        hatchingPotions: false,
        food: false,
        pets: false,
        mounts: false,
        quests: false,
        gear: false,
        special: false,
      },
      expandUpdateItems: false,
      expandContrib: false,
      itemTypes: ['eggs', 'hatchingPotions', 'food', 'pets', 'mounts', 'quests', 'gear', 'special'],
      errorsHeading: '- ERROR EXISTS',
      errors: {
        partyOrQuest: '',
      },
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
  },
  // async mounted () {
  // },
  methods: {
    authMethodExists (authMethod) {
      if (this.hero.auth[authMethod] && this.hero.auth[authMethod].length !== 0) return true;
      return false;
    },
    formatDate (inputDate) {
      const date = moment(inputDate).utcOffset(0).format('YYYY-MM-DD HH:mm');
      return `${date} UTC`;
    },
    formatTimeZone (inputTimeZoneOffset) {
      const timeZone = (inputTimeZoneOffset / 60) * -1;
      const sign = (timeZone < 0) ? '-' : '+';
      return `${sign}${timeZone} UTC`;
    },
    formatEquipment (gearWorn) {
      const gearTypes = ['head', 'armor', 'weapon', 'shield', 'headAccessory', 'eyewear',
        'body', 'back'];
      let equipmentList = '';
      gearTypes.forEach(gearType => {
        const key = gearWorn[gearType] || '';
        const description = (key)
          ? `<strong>${key}</strong> : ${this.getItemDescription('gear', gearWorn[gearType])}`
          : 'none';
        equipmentList += `<li>${gearType} : ${description}</li>\n`;
      });
      return equipmentList;
    },

    collateItemData () {
      // items.special includes many items but we are interested in these only:
      const specialItems = ['snowball', 'spookySparkles', 'shinySeed', 'seafoam'];

      const collatedItemData = {};
      this.itemTypes.forEach(itemType => {
        let basePath = `items.${itemType}`;
        let ownedItems = this.hero.items[itemType] || {};
        let allItems = content[itemType];
        if (itemType === 'gear') {
          basePath = 'items.gear.owned';
          ownedItems = this.hero.items.gear.owned || {};
          allItems = content.gear.flat;
        }
        const itemData = [];

        for (const key of Object.keys(ownedItems)) {
          // Do not sort keys. Order in the items object gives hints about order received.

          if (itemType !== 'special' || specialItems.includes(key)) {
            // we want null values shown as visible text (e.g., Mounts that were Released)
            const value = ownedItems[key];
            const valueForDisplay = (value === null) ? 'NULL' : value;
            itemData.push({
              neverOwned: false,
              key,
              name: this.getItemDescription(itemType, key),
              path: `${basePath}.${key}`,
              value,
              valueForDisplay,
            });
          }
        }

        for (const key of Object.keys(allItems).sort()) {
          // These are never-owned items so we sort by key for convenient viewing.

          if (
            // ignore items the user owns because they were listed above:
            !(key in ownedItems)

            // ignore gear items that indicate empty equipped slots (e.g., head_base_0):
            && !(itemType === 'gear' && content.gear.flat[key].set
              && content.gear.flat[key].set === 'base-0')

            // ignore "special" items that aren't Snowballs, Seafoam, etc:
            && (itemType !== 'special' || specialItems.includes(key))
          ) {
            // these types of items have true/false/null values (all other have integers):
            const booleanTypes = ['mounts', 'gear'];

            let value;
            let valueForDisplay;
            if (booleanTypes.includes(itemType)) {
              value = ''; // we want no default value in the "Update Items" input box
              valueForDisplay = 'never owned';
            } else {
              value = 0;
              valueForDisplay = '0 (never owned)';
            }
            itemData.push({
              neverOwned: true,
              key,
              name: this.getItemDescription(itemType, key),
              path: `${basePath}.${key}`,
              value,
              valueForDisplay,
            });
          }
        }
        collatedItemData[itemType] = itemData;
      });
      return collatedItemData;
    },
    getItemDescription (itemType, key) {
      // Returns item name. Also returns other info for equipment.
      const simpleItemTypes = ['eggs', 'hatchingPotions', 'food', 'quests', 'special'];
      if (simpleItemTypes.includes(itemType) && content[itemType][key]) {
        return content[itemType][key].text();
      }
      if (itemType === 'mounts' && content.mountInfo[key]) {
        return content.mountInfo[key].text();
      }
      if (itemType === 'pets' && content.petInfo[key]) {
        return content.petInfo[key].text();
      }
      if (itemType === 'gear' && content.gear.flat[key]) {
        const name = content.gear.flat[key].text();
        const description = this.getGearSetDescription(key);
        if (description) return `${name} -- ${description}`;
        return name;
      }
      return 'NO NAME - invalid item?';
    },
    getGearSetDescription (key) {
      let setName = this.getGearSetName(key);
      if (setName === 'special-takeThis') {
        // no point displaying set details for gear where it's obvious
        return '';
      }
      const klassNames = {
        healer: 'Healer',
        rogue: 'Rogue',
        warrior: 'Warrior',
        wizard: 'Mage',
      };
      const loginIncentivesGear = ['armor_special_bardRobes', 'armor_special_dandySuit', 'armor_special_lunarWarriorArmor', 'armor_special_nomadsCuirass', 'armor_special_pageArmor', 'armor_special_samuraiArmor', 'armor_special_sneakthiefRobes', 'armor_special_snowSovereignRobes', 'back_special_snowdriftVeil', 'head_special_bardHat', 'head_special_clandestineCowl', 'head_special_dandyHat', 'head_special_kabuto', 'head_special_lunarWarriorHelm', 'head_special_pageHelm', 'head_special_snowSovereignCrown', 'head_special_spikedHelm', 'shield_special_diamondStave', 'shield_special_lootBag', 'shield_special_wakizashi', 'shield_special_wintryMirror', 'weapon_special_bardInstrument', 'weapon_special_fencingFoil', 'weapon_special_lunarScythe', 'weapon_special_nomadsScimitar', 'weapon_special_pageBanner', 'weapon_special_skeletonKey', 'weapon_special_tachi'];

      const goldQuestsGear = ['armor_special_finnedOceanicArmor', 'head_special_fireCoralCirclet', 'weapon_special_tridentOfCrashingTides', 'shield_special_moonpearlShield', 'head_special_pyromancersTurban', 'armor_special_pyromancersRobes', 'weapon_special_taskwoodsLantern', 'armor_special_mammothRiderArmor', 'head_special_mammothRiderHelm', 'weapon_special_mammothRiderSpear', 'shield_special_mammothRiderHorn', 'armor_special_roguishRainbowMessengerRobes', 'head_special_roguishRainbowMessengerHood', 'weapon_special_roguishRainbowMessage', 'shield_special_roguishRainbowMessage', 'eyewear_special_aetherMask', 'body_special_aetherAmulet', 'back_special_aetherCloak', 'weapon_special_aetherCrystals'];

      const animalGear = ['back_special_bearTail', 'back_special_cactusTail', 'back_special_foxTail', 'back_special_lionTail', 'back_special_pandaTail', 'back_special_pigTail', 'back_special_tigerTail', 'back_special_wolfTail', 'headAccessory_special_bearEars', 'headAccessory_special_cactusEars', 'headAccessory_special_foxEars', 'headAccessory_special_lionEars', 'headAccessory_special_pandaEars', 'headAccessory_special_pigEars', 'headAccessory_special_tigerEars', 'headAccessory_special_wolfEars'];

      let wantSetName = true; // some set names are useful, others aren't
      let setType = '[cannot determine set type]';
      if (setName === 'base-0') {
        setType = 'empty slot';
        wantSetName = false;
      } else if (setName.includes('special-turkey')) {
        setType = '<a href="https://habitica.fandom.com/wiki/Turkey_Day">Turkey Day</a>';
        wantSetName = false;
      } else if (setName.includes('special-nye')) {
        setType = '<a href="https://habitica.fandom.com/wiki/Event_Item_Sequences">New Year\'s Eve</a>';
        wantSetName = false;
      } else if (setName.includes('special-birthday')) {
        setType = '<a href="https://habitica.fandom.com/wiki/Habitica_Birthday_Bash">Habitica Birthday Bash</a>';
        wantSetName = false;
      } else if (setName.includes('special-0') || key === 'weapon_special_3') {
        setType = '<a href="https://habitica.fandom.com/wiki/Kickstarter">Kickstarter 2013</a>';
        wantSetName = false;
      } else if (setName.includes('special-1')) {
        setType = 'Contributor gear';
        wantSetName = false;
      } else if (setName.includes('special-2') || key === 'shield_special_goldenknight') {
        setType = '<a href="https://habitica.fandom.com/wiki/Legendary_Equipment">Legendary Equipment</a>';
        wantSetName = false;
      } else if (setName.includes('special-wondercon')) {
        setType = '<a href="https://habitica.fandom.com/wiki/Unconventional_Armor">Unconventional Armor</a>';
        wantSetName = false;
      } else if (loginIncentivesGear.includes(key)) {
        setType = '<a href="https://habitica.fandom.com/wiki/Daily_Check-In_Incentives">Check-In Incentive</a> or from <a href="https://habitica.fandom.com/wiki/Quest_Lines#Lunar_Battle_Quest_Line">Lunar Battle Quest Line</a>';
        wantSetName = false;
      } else if (goldQuestsGear.includes(key)) {
        setType = 'from <a href="https://habitica.fandom.com/wiki/Quest_Lines#Gold_Purchasable_Quest_Lines">Gold-Purchasable Quest Lines</a>';
        wantSetName = false;
      } else if (animalGear.includes(key)) {
        setType = '<a href="https://habitica.fandom.com/wiki/Avatar_Customizations">Animal Avatar Accessory Customisations</a>';
        wantSetName = false;
      } else if (!content.gear.flat[key].klass) {
        setType = 'NO "klass" [omission in API data]';
      } else if (content.gear.flat[key].klass === 'armoire') {
        setType = 'Armoire set';
      } else if (content.gear.flat[key].klass === 'mystery') {
        setType = 'Mystery Items';
        setName = setName.replace(/mystery-(....)(..)/, '$1-$2');
      } else if (content.gear.flat[key].klass === 'special') {
        const specialClass = content.gear.flat[key].specialClass || '';
        if (specialClass && Object.keys(klassNames).includes(specialClass)) {
          setType = `Grand Gala ${klassNames[specialClass]} set`;
        } else if (key.includes('special_gaymerx')) {
          setType = 'GaymerX';
          wantSetName = false;
        } else if (key.includes('special_ks2019')) {
          setType = '<a href="https://habitica.fandom.com/wiki/Kickstarter">Kickstarter 2019</a>';
          wantSetName = false;
        } else {
          setType = '[unknown set]';
          wantSetName = false;
        }
      } else if (Object.keys(klassNames).includes(content.gear.flat[key].klass)) {
        // e.g., base class gear such as weapon_warrior_6 (Golden Sword)
        setType = `base ${klassNames[content.gear.flat[key].klass]} gear`;
        wantSetName = false;
      }
      return (wantSetName) ? `${setType}: ${setName}` : setType;
    },
    getGearSetName (key) {
      let set = 'NO SET [probably an omission in the API data]';
      if (content.gear.flat[key].set) {
        set = `${content.gear.flat[key].set}`;
      }
      return set;
    },
    changeData (path, currentValue) {
      this.expandUpdateItems = true;
      this.expandItems = false;
      this.hero.itemPath = path;
      this.hero.itemVal = currentValue;
    },

    determineQuestStatus () { // XXX check all paths through this
      // Quest data is in the user doc and party doc. They can be out of sync.
      // Here we collate data from both sources, showing error messages if needed.

      // First get data from the party's doc.
      let questExists = false; // true if quest is active or in invitation stage
      let questIsRunning = false; // true if quest is active (invitation stage ended)
      let invitationStatusForUser = '';
      let expectedRsvpStatusForUser = false;
      let errorMessage = '';
			// XXX_SOON see if those variables are all needed
      // this.TST_1 = 'this.hasParty - questIsRunning - this.party.quest.members';
      // this.TST_2 = `${this.hasParty} - ${questIsRunning} - ${this.party.quest.members}`;
      if (this.hasParty && this.party.quest) {
        questIsRunning = this.party.quest.active;
        if (this.party.quest.key) {
          questExists = true;
          if (!this.party.quest.members) {
            errorMessage = 'quest is running or in invitation stage but has no participants';
          } else if (this.party.quest.members[this.hero.id] === null) {
            invitationStatusForUser = 'pending';
            if (questIsRunning) {
              errorMessage = 'quest is running but user\'s invitation is still pending in quest object';
            } else {
              expectedRsvpStatusForUser = true;
            }
          } else if (this.party.quest.members[this.hero.id] === false) {
            invitationStatusForUser = 'rejected';
            if (questIsRunning) errorMessage = 'quest is running and user\'s invitation was rejected BUT it wasn\'t cleared properly from the quest\'s data. ';
          } else if (this.party.quest.members[this.hero.id] === true) {
            invitationStatusForUser = 'accepted';
          } else if (questIsRunning) {
            invitationStatusForUser = 'rejected OR not accepted before quest start OR user joined party after quest started';
            alert(invitationStatusForUser);
          } else {
            invitationStatusForUser = 'missing';
            errorMessage = 'quest is in invitation stage but user doesn\'t have an invitation';
          }
        } else if (questIsRunning) {
          errorMessage = 'quest is running but there is no "key" to say which quest it is.';
					// TODO display a similar message for when it happens during invitation stage
        }
      }

      let questStatus = '<p>';
      if (questExists) {
        questStatus = 'Quest exists and is ';
        if (questIsRunning) {
          questStatus += 'running.<br>User is ';
          if (invitationStatusForUser !== 'accepted') questStatus += 'not ';
          questStatus += 'a participant.';
        } else {
          questStatus += 'in invitation stage.<br>'
            + `User's invitation is ${invitationStatusForUser}.`;
        }
				questStatus += '<br>';
				if (this.party.quest.leader === this.hero.id) {
					questStatus += 'User is the quest owner.';
				} else {
					questStatus += `Quest owner is <a href="/profile/${this.party.quest.leader}" target="_blank">${this.party.quest.leader}</a>`;// XXX_LATR improve
				}
      } else {
        questStatus = 'No quest.';
      }
      if (errorMessage) {
        questStatus += '<br>Quest is in erroneous state - see error above.';
        this.errors.partyOrQuest += `ERROR: ${errorMessage}<br>`;
      }
      questStatus += '</p>';

      // Assess quest participants.
      if (questExists) {
				questStatus += '<p>';
        const countOfQuestPartipants = Object.keys(this.party.quest.members).length;
        if (countOfQuestPartipants) {
          questStatus += `Quest has ${countOfQuestPartipants} participants:<ul>`;
				  for (const [memberId, invitationStatus] of Object.entries(this.party.quest.members)) {
						questStatus += '<li>';
						questStatus += (memberId === this.hero.id)
							? `@${this.hero.auth.local.username}`
							: `<a href="/profile/${memberId}" target="_blank">${memberId}</a>`;// XXX_LATR improve
						const errMsg = ' - MINOR ERROR: this data should have been deleted when quest started';
						let invitationDescription = '';
						if (invitationStatus === true) {
							if (!questIsRunning) invitationDescription = ' - invitation accepted';
							// we don't display anything if quest is running - obvious that participant accepted
						} else if (invitationStatus === false) {
							invitationDescription += ' - invitation rejected';
							if (questIsRunning) invitationDescription += errMsg;
						} else {
							invitationDescription += ' - invitation pending';
							if (questIsRunning) invitationDescription += errMsg;
						}
						questStatus += invitationDescription;
						questStatus += '</li>';
					}
          questStatus += '</ul></p>';
        } else {
          this.errors.partyOrQuest += 'ERROR: Quest has no participants.<br>';
        }
				questStatus += '</p>';
      }

      // Now get data from the user's doc and notify about errors.
      if (!this.hero.party.quest) this.hero.party.quest = {};
      if (this.hero.party.quest.RSVPNeeded !== expectedRsvpStatusForUser) {
        this.errors.partyOrQuest += `ERROR: User's quest invitation ("party.quest.RSVPNeeded") should be "${expectedRsvpStatusForUser}" but isn't.<br>`;
      }

			// XXX UPTOHERE
      if (invitationStatusForUser === 'pending' || invitationStatusForUser === 'accepted') {
        if (!this.hero.party.quest.key) {
          this.errors.partyOrQuest
            += 'ERROR: User has accepted quest invitation or invitation is still pending but their account has no "key" for the quest.<br>';
        } else if (this.hero.party.quest.key !== this.party.quest.key) {
          this.errors.partyOrQuest
            += `ERROR: User has accepted quest invitation but the "key" in their account (${this.hero.party.quest.key}) is different than the quest's "key" (${this.party.quest.key}).<br>`;
        }
      } else if (this.hero.party.quest.key) {
        this.errors.partyOrQuest // XXX is this actually bad?
          += 'ERROR: User has a "key" for the quest but should not have (no quest exists or user not participating).<br>';
				// look into this:
				// correct (past invitation stage):
				//    ERROR: quest is running but there is no "key" to say which quest it is.
				// wrong:
				//    ERROR: User has a "key" for the quest but should not have
				//           (no quest exists or user not participating).
      }

      // Display details of quest (name, type, progress, etc).
      if (questExists) {
        const questContent = this.content.quests[this.party.quest.key];
        // alert(JSON.stringify(questContent, null, '  ')); // TST // eslint-disable-line no-console
        questStatus += `<p>Quest "key": ${questContent.key}`; // XXX get name ("text") working
        if (questContent.boss) {
          questStatus += '' // `<br>Boss name: ${questContent.boss.name}` // XXX fix
            + `<br>Boss HP: ${questContent.boss.hp}`
            + `<br>Boss Strength: ${questContent.boss.str}`;
          // XXX_SOON add rage details
        } else {
          questStatus += '<br>Collect:<ul>';
				  for (const [key, obj] of Object.entries(questContent.collect)) {
						questStatus += `<li>${key}: ${obj.count}</li>`; // XXX get name
					}
          questStatus += '</ul>';
          // XXX FYI: "collect":{"moonstone":{"text":"Moonstones","count":100}},
        }
        questStatus += '</p>';

        // XXX UPTOHERE
        // XXX display this for running quest, and totals needed from content:
        // "party.quest.progress": {
        // "up": 0,
        // "down": 0,
        // "collectedItems": 0,
        // "collect": {}
        // },

        // "basilist":{"text":"The Basi-List",
        // "notes":"There's a ",
        // "group":"questGroupEarnable",
        // "completion":"The Basi-list has ",
        // "goldValue":100,"category":"unlockable",
        // "unlockCondition":{"condition":"party invite","text":"Invite Friends"},
        // "boss":{"name":"The Basi-List","hp":100,"str":0.5,"def":1},
        // "drop":{"gp":8,"exp":42},"key":"basilist"}
      }

			this.questStatus = questStatus; // XXX_SOON just use this. throughout?
    },

    async loadHero (id) {
      let uuid = id || this.user._id;
      uuid = uuid.replace(/@/, ''); // allow "@name" to be entered
      const hero = await this.$store.dispatch('hall:getHero', { uuid });
      this.hero = { ...hero };

      // XXX can we initialise data on page load and for user load with one function?

      // initialise error messages for this user
      this.errors = {
        partyOrQuest: '',
      };

      if (!this.hero.flags) {
        this.hero.flags = {
          chatRevoked: false,
          chatShadowMuted: false,
        };
      }

      this.hasParty = false;
      if (this.hero.party && this.hero.party._id) {
        let party;
        try {
          party = await this.$store.dispatch('hall:getHeroParty', { groupId: this.hero.party._id });
          this.hasParty = true;
          this.party = { ...party };
					this.isPartyLeader = this.party.leader === this.hero.id;
        } catch (e) {
          // the API's error message isn't worth reporting ("Request failed with status code 404")
          this.errors.partyOrQuest += 'ERROR: User has a Party ID but that Party does not exist. '
            + `Ask a database admin to delete their Party ID (${this.hero.party._id}).<br>`;
        }
      }

      // XXX purge if not needed to clear data from previous run:
      this.TST_1 = '';
      this.TST_2 = '';
      this.TST_3 = '';
      this.questStatus = '';

      // this.party.quest = {}; // TST
      this.TST_2 = JSON.stringify(this.party.quest, null, '  ')
        + JSON.stringify(this.user.party.quest, null, '  ');

      this.determineQuestStatus();
      // alert(this.errors.partyOrQuest);

      this.collatedItemData = this.collateItemData();

      // collapse all sections except those with errors
      this.expandPriv = false;
      this.expandAuth = false;
      // this.expandParty = this.errors.partyOrQuest; // XXX get this working
      this.expandParty = 'XXX TST';
      this.expandAvatar = false;
      this.expandItems = false;
      this.expandUpdateItems = false;
      this.expandContrib = false;
      this.itemTypes.forEach(itemType => { this.expandItemType[itemType] = false; });
    },
    async saveHero () {
      this.hero.contributor.admin = this.hero.contributor.level > 7;
      await this.$store.dispatch('hall:updateHero', { heroDetails: this.hero });
      this.text('User updated');
      this.hero = {};
      // this.heroID = ''; // uncomment if we want to clear the search box after saving
    },
  },
};
</script>
