import { DialogModel, MessageModel } from '../models/index.js';

class DialogController {
  constructor(io) {
    this.io = io;
  }

  index = (req, res) => {
    const userId = req.user._id;

    DialogModel.find()
      .or([{ author: userId }, { partner: userId }])
      .populate(['author', 'partner'])
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'user',
        },
      })
      .exec(function (err, dialogs) {
        if (err) {
          return res.status(404).json({
            message: 'Dialogs not found',
          });
        }
        return res.json(dialogs);
      });
  };

  create = (req, res) => {
    const postData = {
      author: req.user._id,
      partner: req.body.partner,
    };

    DialogModel.findOne(
      {
        author: req.user._id,
        partner: req.body.partner,
      },
      (err, dialog) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: err,
          });
        }
        if (dialog) {
          return res.status(403).json({
            status: 'error',
            message: 'Такой диалог уже есть',
          });
        } else {
          const dialog = new DialogModel(postData);

          dialog
            .save()
            .then((dialogObj) => {
              dialogObj.lastMessage = null;
              dialogObj.save().then(() => {
                res.json(dialogObj);
                this.io.emit('SERVER:DIALOG_CREATED', {
                  ...postData,
                  dialog: dialogObj,
                });
              });
            })
            .catch((err) => {
              res.json({
                status: 'error',
                message: err,
              });
            });
        }
      },
    );
  };

  delete = (req, res) => {
    const id = req.params.id;
    DialogModel.findOneAndRemove({ _id: id })
      .then((dialog) => {
        if (dialog) {
          res.json({
            message: `Dialog deleted`,
          });
        }
      })
      .catch(() => {
        res.json({
          message: `Dialog not found`,
        });
      });
  };

  async unreadDialogsCount(req, res) {
    try {
      const userId = req.user._id;

      const dialog = await DialogModel.find()
        .or([{ author: userId }, { partner: userId }])
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'user',
          },
        });

      const filteredDialogs = await dialog.filter(
        (item) =>
          item.lastMessage &&
          !item.lastMessage.read &&
          item.lastMessage.user._id.toString() !== userId,
      ).length;

      return res.json({ unreadDialogsCount: filteredDialogs });
    } catch (error) {
      console.log(error);
    }
  }
}

export default DialogController;
