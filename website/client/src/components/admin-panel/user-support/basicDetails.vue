<template>
  <div>
    <h2>@{{ auth.local.username }} &nbsp; / &nbsp; {{ profile.name }}</h2>
    {{ userId }} &nbsp;
    <router-link :to="{'name': 'userProfile', 'params': {'userId': userId}}">
      profile link
    </router-link>
    <br>
    language: {{ preferences.language }}
  </div>
</template>

<style lang="scss" scoped>
  @import '~@/assets/scss/admin-panel.scss';
</style>

<script>
export default {
  props: {
    userId: {
      type: String,
      required: true,
    },
    auth: {
      type: Object,
      required: true,
    },
    preferences: {
      type: Object,
      required: true,
    },
    profile: {
      type: Object,
      required: true,
    },
  },
};
</script>
