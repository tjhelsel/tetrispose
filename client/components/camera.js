import React, {Component} from 'react'
import * as posenet from '@tensorflow-models/posenet'
import {connect} from 'react-redux'
import {movedLeft, movedRight, rotated, changePhase, moved} from '../store/game'
import {getShape, checkRotation, checkPosition} from './utility'
import {shapeAchieved, setUserShape} from '../store/currentShape'
import {
  Dimmer,
  Loader,
  Image as SemanticImage,
  Segment
} from 'semantic-ui-react'

class Camera extends Component {
  constructor() {
    super()
    this.state = {
      // prevKnee: '',
      activeCamera: true,
      rotationsCounter: 0,
      canvasIsPainted: false
    }
    this.getVideo = this.getVideo.bind(this)
    this.getCanvas = this.getCanvas.bind(this)
  }

  async componentDidMount() {
    try {
      console.log('loading posenet...')
      this.posenet = await posenet.load({
        architecture: 'ResNet50',
        outputStride: 32,
        inputResolution: 193,
        quantBytes: 1
      })
      if (this.posenet) console.log('posenet loaded!')
    } catch (err) {
      console.error(err)
      throw new Error('Posenet failed to load')
    } finally {
      await this.setupCamera()
    }
  }

  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available'
      )
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: 640,
          height: 480
        }
      })
      this.setState({activeCamera: false})
      this.video.srcObject = stream
    } catch (err) {
      console.error(err)
    } finally {
      this.detectPose()
    }
  }

  async detectPose() {
    let pose = await this.posenet.estimateSinglePose(this.video, {
      flipHorizontal: false
    })

    if (this.props.phase === 1) {
      if (this.state.canvasIsPainted) {
        this.setState({canvasIsPainted: false})
      }
      this.clearCanvas()
      const currentShape = getShape(pose)

      this.props.setUserShape(currentShape)

      if (
        this.props.currentShape.name &&
        this.props.currentShape.name === this.props.userShape
      ) {
        this.props.shapeAchieved()
      }
    }

    if (this.props.phase === 2) {
      if (!this.state.canvasIsPainted) {
        this.drawRotations(this.props.currentShape.rotations)
        this.setState({canvasIsPainted: true})
      }

      const column = checkPosition(pose)
      this.props.move(column)

      // This function attempts to use a 'target' pose
      // const targetRotation = checkRotation(pose)
      // this.props.rotate(this.props.currentShape.rotations,
      //   targetRotation)
      // const rotations = this.props.currentShape.rotations
      // console.log(this.state.canvasIsPainted)

      //Attempting rotation using throttle
      // const rotate = throttle(checkRotation, pose, 250)
      // if (rotate) {
      //   console.log(this.state.rotationsCounter)
      //   this.props.rotate(
      //     this.props.currentShape.rotations,
      //     this.state.rotationsCounter
      //   )
      const rotations = this.props.currentShape.rotations
      const targetRotation = checkRotation(pose, rotations)
      if (targetRotation !== undefined) {
        this.props.rotate(rotations, targetRotation)
      }
    }

    this.setState(prevState => ({
      rotationsCounter: prevState.rotationsCounter + 1
    }))

    //This is the original function (with knee-raises to rotate)
    // const rotation = checkRotation(pose, this.state.prevKnee)
    // if (rotation.rotate) {
    //   this.props.rotate(
    //     this.props.currentShape.rotations,
    //     this.state.rotationsCounter
    //   )
    //   this.setState(prevState => ({
    //     rotationsCounter: prevState.rotationsCounter + 1,
    //     prevKnee: rotation.knee
    //   }))
    // }

    this.detectPose()
  }

  drawRotations(rotations) {
    const canvas = this.canvas.getContext('2d')
    rotations.forEach((rotation, idx, arr) => {
      const drawPos = (480 + idx * 440) / arr.length
      const img = new Image()
      img.src = `./assets/rotations/${
        this.props.currentShape.name
      }rot${idx}.png`
      img.onload = () => {
        canvas.drawImage(img, drawPos, 20, img.width / 4, img.height / 4)
      }
    })
  }

  clearCanvas() {
    const canvas = this.canvas.getContext('2d')
    canvas.clearRect(0, 0, 640, 480)
  }

  getVideo(element) {
    this.video = element
  }

  getCanvas(element) {
    this.canvas = element
  }

  render() {
    return (
      <div>
        {this.state.activeCamera ? (
          <Segment>
            <Dimmer active>
              <Loader indeterminate>Camera Loading</Loader>
            </Dimmer>
            <SemanticImage src="https://react.semantic-ui.com/images/wireframe/short-paragraph.png" />
          </Segment>
        ) : (
          <div className="camera-position">
            <video
              playsInline
              id="webcam"
              width="640"
              height="480"
              autoPlay={true}
              ref={this.getVideo}
            />
            <canvas
              className="canvas"
              width="640"
              height="480"
              ref={this.getCanvas}
            />
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  currentShape: state.currentShape.shape,
  userShape: state.userShape,
  phase: state.phase,
  gameBoard: state.gameBoard
})

const mapDispatchToProps = dispatch => ({
  shapeAchieved: () => dispatch(shapeAchieved()),
  setUserShape: shape => dispatch(setUserShape(shape)),
  changePhase: () => dispatch(changePhase()),
  moveLeft: () => dispatch(movedLeft()),
  moveRight: () => dispatch(movedRight()),
  rotate: (grid, rotations, counter) =>
    dispatch(rotated(grid, rotations, counter)),
  move: column => dispatch(moved(column))
})

export default connect(mapStateToProps, mapDispatchToProps)(Camera)
