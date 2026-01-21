import app from './app';
import auth from './auth';
import common from './common';
import entities from './entities';
import course from './course';
import result from './result';
import transformations from './transformations';
import workflow from './workflow';
import landing from './landing';
import admin from './admin';

export default {
  ...app,
  ...auth,
  ...common,
  ...entities,
  ...course,
  ...result,
  ...transformations,
  ...workflow,
  ...landing,
  ...admin
};
