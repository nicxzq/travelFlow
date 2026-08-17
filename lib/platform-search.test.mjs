import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlatformKeyword, buildPlatformLaunch } from './platform-search.ts';

test('builds a short local food query with family and value constraints', () => {
  const keyword = buildPlatformKeyword({
    scenario: 'food',
    placeName: '平遥古城',
    availableHours: 4,
  });

  assert.match(keyword, /平遥古城/);
  assert.match(keyword, /当地特色/);
  assert.match(keyword, /适合家庭/);
  assert.match(keyword, /性价比/);
});

test('uses the selected duration for a nearby attraction query', () => {
  const keyword = buildPlatformKeyword({
    scenario: 'attraction',
    placeName: '平遥古城',
    availableHours: 6,
  });

  assert.equal(keyword, '平遥古城 附近 6小时 亲子 少走路 景点');
});

test('builds the documented Amap URI with longitude before latitude', () => {
  const launch = buildPlatformLaunch({
    platform: 'amap',
    scenario: 'food',
    placeName: '平遥古城',
    availableHours: 4,
    coordinates: { lat: 37.2, lng: 112.18 },
  });
  const url = new URL(launch.url);

  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'uri.amap.com');
  assert.equal(url.pathname, '/search');
  assert.equal(url.searchParams.get('center'), '112.18,37.2');
  assert.equal(url.searchParams.get('callnative'), '1');
  assert.equal(url.searchParams.get('view'), 'list');
  assert.equal(url.searchParams.get('keyword'), launch.keyword);
  assert.equal(launch.directSearch, true);
});

test('omits Amap center when location was not granted', () => {
  const launch = buildPlatformLaunch({
    platform: 'amap',
    scenario: 'hotel',
    placeName: '平遥古城',
    availableHours: 4,
  });

  assert.equal(new URL(launch.url).searchParams.has('center'), false);
});

test('uses only official HTTPS entries for marketplace platforms', () => {
  const shared = {
    scenario: 'hotel',
    placeName: '平遥古城',
    availableHours: 4,
  };
  const meituan = buildPlatformLaunch({ ...shared, platform: 'meituan' });
  const dianping = buildPlatformLaunch({ ...shared, platform: 'dianping' });
  const ctrip = buildPlatformLaunch({ ...shared, platform: 'ctrip' });

  assert.equal(new URL(meituan.url).hostname, 'www.meituan.com');
  assert.equal(new URL(dianping.url).hostname, 'www.dianping.com');
  assert.equal(new URL(ctrip.url).hostname, 'm.ctrip.com');
  assert.equal(meituan.directSearch, false);
  assert.equal(dianping.directSearch, false);
  assert.equal(ctrip.directSearch, false);
});
