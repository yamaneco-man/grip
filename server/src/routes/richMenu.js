const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const richMenuService = require('../services/line/richMenu');

// リッチメニュー一覧
router.get('/', authenticate, async (req, res) => {
  try {
    const menus = await richMenuService.getRichMenus(req.user.id);
    res.json(menus);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// リッチメニュー作成
router.post('/', authenticate, async (req, res) => {
  try {
    const menu = await richMenuService.createRichMenu(req.user.id, req.body);
    res.status(201).json(menu);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// リッチメニュー更新
router.put('/:id', authenticate, async (req, res) => {
  try {
    const menu = await richMenuService.updateRichMenu(req.user.id, req.params.id, req.body);
    res.json(menu);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// リッチメニュー削除
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await richMenuService.deleteRichMenu(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 自動切替ルール追加
router.post('/:id/rules', authenticate, async (req, res) => {
  try {
    const rule = await richMenuService.addSwitchRule(req.user.id, req.params.id, req.body);
    res.status(201).json(rule);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 自動切替ルール削除
router.delete('/rules/:ruleId', authenticate, async (req, res) => {
  try {
    await richMenuService.deleteSwitchRule(req.user.id, req.params.ruleId);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
